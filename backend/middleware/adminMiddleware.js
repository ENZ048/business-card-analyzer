const { authMiddleware } = require('./authMiddleware');

// Admin middleware - requires authentication and admin role
const adminMiddleware = async (req, res, next) => {
  try {
    // First check authentication
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is admin
    if (!req.user || !req.user.isAdmin()) {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(401).json({
      error: 'Authentication required'
    });
  }
};

// Super admin middleware - requires super admin role
const superAdminMiddleware = async (req, res, next) => {
  try {
    // First check authentication
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is super admin
    if (!req.user || !req.user.isSuperAdmin()) {
      return res.status(403).json({
        error: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    res.status(401).json({
      error: 'Authentication required'
    });
  }
};

module.exports = {
  adminMiddleware,
  superAdminMiddleware
};
