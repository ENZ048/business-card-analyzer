const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DemoSession = require('../models/DemoSession');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided, authorization denied' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from token (include sessionToken for validation)
    const user = await User.findById(decoded.userId).select('-password +sessionToken');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Token is not valid' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'User account is deactivated' 
      });
    }

    // Check session token for single active session (only for regular users, not admins/superadmins)
    const isRegularUser = !user.isAdmin() && user.role === 'user';
    if (isRegularUser && user.sessionToken) {
      // If JWT has a sessionToken, it must match the one in database
      if (decoded.sessionToken) {
        if (decoded.sessionToken !== user.sessionToken) {
          return res.status(401).json({ 
            error: 'Session expired. Please login again.' 
          });
        }
      } else {
        // JWT doesn't have sessionToken but user has one - token is from old session
        return res.status(401).json({ 
          error: 'Session expired. Please login again.' 
        });
      }
    }

    req.user = user;
    req.user.id = user._id; // Add id property for compatibility

    // For demo users, attach session scans from JWT
    const DEMO_USER_EMAIL = (process.env.DEMO_USER_EMAIL || 'bd@troikatech.net').toLowerCase();
    const treatAsDemo = !!(user && (user.isDemo || (user.email && user.email.toLowerCase() === DEMO_USER_EMAIL)));
    logger.info('========== AUTH MIDDLEWARE ==========');
    logger.info('User.isDemo:', user.isDemo, '| Email matches demo:', user.email?.toLowerCase() === DEMO_USER_EMAIL);
    logger.info('User.email:', user.email);
    logger.info('Decoded JWT:', JSON.stringify(decoded, null, 2));
    
    if (treatAsDemo) {
      // Get sessionScans from database for demo users
      try {
        const demoSession = await DemoSession.getOrCreateSession(user._id);
        req.user.sessionScans = demoSession.sessionScans;
        logger.info('✅ Demo user authenticated with sessionScans from DB');
        logger.info('   User ID:', user._id);
        logger.info('   Email:', user.email);
        logger.info('   DB sessionScans:', demoSession.sessionScans);
        logger.info('   Attached to req.user.sessionScans:', req.user.sessionScans);
      } catch (error) {
        logger.error('❌ Error getting demo session from DB:', error.message);
        // Fallback to JWT if DB fails
        req.user.sessionScans = decoded.sessionScans || 5;
        logger.info('   Fallback to JWT sessionScans:', req.user.sessionScans);
      }
    } else {
      logger.info('✅ Regular user authenticated (no sessionScans needed)');
    }
    logger.info('========== AUTH MIDDLEWARE END ==========');

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Token is not valid' 
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};