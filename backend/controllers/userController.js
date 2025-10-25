const mongoose = require('mongoose');
const User = require('../models/User');
const Usage = require('../models/Usage');
const Plan = require('../models/Plan');
const DemoSession = require('../models/DemoSession');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const whatsappOTPService = require('../services/whatsappOTPService');

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

// Demo user helpers
const DEMO_USER_EMAIL = (process.env.DEMO_USER_EMAIL || 'bd@troikatech.net').toLowerCase();
const isDemoUser = (user) => !!(user && (user.isDemo || (user.email && user.email.toLowerCase() === DEMO_USER_EMAIL)));

// Generate JWT token
const generateToken = (userId, sessionScans = null) => {
  const payload = { userId };

  // For demo users, include session-based scan count in JWT
  if (sessionScans !== null) {
    payload.sessionScans = sessionScans;
  }

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// User registration
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, companyName, phoneNumber } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !companyName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Get or create starter plan
    let starterPlan = await Plan.findOne({ name: 'starter' });
    if (!starterPlan) {
      // Create default plans if they don't exist
      const defaultPlans = Plan.getDefaultPlans();
      await Plan.insertMany(defaultPlans);
      starterPlan = await Plan.findOne({ name: 'starter' });
    }

    // Calculate plan end date (30 days from now)
    const planStartDate = new Date();
    const planEndDate = new Date();
    planEndDate.setDate(planEndDate.getDate() + 30);

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      companyName,
      phoneNumber,
      currentPlan: starterPlan._id,
      planStartDate,
      planEndDate
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        currentPlan: {
          id: starterPlan._id,
          name: starterPlan.name,
          displayName: starterPlan.displayName,
          cardScansLimit: starterPlan.cardScansLimit,
          validityMonths: starterPlan.validityMonths
        },
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token - for demo users, reset session scans to 5
    let token;
    let sessionScans = null;

    logger.info('========== LOGIN START ==========');
    logger.info('🔍 LOGIN - User isDemo:', user.isDemo, '| Email:', user.email);
    logger.info('User._id:', user._id);
    logger.info('User.isDemo type:', typeof user.isDemo);
    logger.info('User.isDemo value:', user.isDemo);

    if (isDemoUser(user)) {
      // Create or reset demo session in database
      const demoSession = await DemoSession.resetSessionOnLogin(user._id);
      sessionScans = demoSession.sessionScans;
      token = generateToken(user._id, sessionScans);
      logger.info('✅ DEMO USER LOGIN - Created/reset session in DB with sessionScans:', sessionScans);
      logger.info('Token generated:', token.substring(0, 50) + '...');
    } else {
      token = generateToken(user._id);
      logger.info('✅ REGULAR USER LOGIN - Generated token without sessionScans');
    }

    logger.info('📦 Response user object:', {
      id: user._id,
      email: user.email,
      isDemo: user.isDemo,
      sessionScans: sessionScans
    });
    logger.info('========== LOGIN END ==========');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isDemo: isDemoUser(user),
        sessionScans: sessionScans
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Get user usage analytics
const getUserUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get user's current plan
    const user = await User.findById(userId).populate('currentPlan');

    // Handle demo users separately - use session scans from database
    if (isDemoUser(user)) {
      // Get session from database
      const demoSession = await DemoSession.getOrCreateSession(userId);
      const sessionScans = demoSession.sessionScans;

      logger.info('========== GET USAGE - DEMO USER ==========');
      logger.info('📊 GET USAGE - Demo User Detected');
      logger.info('   User ID:', userId);
      logger.info('   User Email:', user.email);
      logger.info('   User.isDemo:', user.isDemo);
      logger.info('   DB sessionScans:', sessionScans);
      logger.info('   Sending sessionScans:', sessionScans);
      logger.info('========== GET USAGE END ==========');

      return res.json({
        success: true,
        data: {
          totalCards: 0,
          thisMonth: 0,
          lastMonth: 0,
          planLimit: 5,
          planType: 'Demo',
          planId: user.currentPlan?._id || null,
          planEndDate: null,
          daysRemaining: null,
          isPlanExpired: false,
          recentActivity: [],
          isDemo: true,
          sessionScans: sessionScans
        }
      });
    }

    // Get current usage
    const currentUsage = await Usage.findOne({
      user: new mongoose.Types.ObjectId(userId),
      year: currentYear,
      month: currentMonth
    });

    // Get last month usage
    const lastMonthUsage = await Usage.findOne({
      user: new mongoose.Types.ObjectId(userId),
      year: lastMonthYear,
      month: lastMonth
    });

    // Get total usage across all time
    const totalUsage = await Usage.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalCards: { $sum: '$cardScansUsed' } } }
    ]);

    const plan = user.currentPlan;

    // Get recent activity from all usage records
    const allUsageRecords = await Usage.find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('plan', 'name')
      .select('activities year month createdAt');

    // Flatten and sort all activities from all usage records
    const allActivities = [];
    allUsageRecords.forEach(usage => {
      if (usage.activities && usage.activities.length > 0) {
        usage.activities.forEach(activity => {
          allActivities.push({
            id: `${usage._id}_${activity._id}`,
            type: activity.type,
            date: activity.processedAt.toISOString().split('T')[0],
            status: 'completed',
            count: activity.count,
            month: usage.month,
            year: usage.year
          });
        });
      }
    });

    // Sort by date (most recent first) and limit to 10
    const recentActivity = allActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Calculate plan days remaining
    let daysRemaining = 0;
    let planEndDate = null;
    let isPlanExpired = false;
    
    if (user.planEndDate) {
      planEndDate = user.planEndDate;
      const now = new Date();
      const timeDiff = user.planEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      isPlanExpired = daysRemaining <= 0;
      
      // Ensure daysRemaining is never NaN
      if (isNaN(daysRemaining)) {
        daysRemaining = 0;
        isPlanExpired = true;
      }
    } else {
      // If user doesn't have planEndDate, set a default 30-day trial
      const now = new Date();
      planEndDate = new Date();
      planEndDate.setDate(now.getDate() + 30);
      daysRemaining = 30;
      isPlanExpired = false;
      
      // Update user with default plan dates
      user.planStartDate = now;
      user.planEndDate = planEndDate;
      await user.save();
    }

    // Calculate usage data
    const usageData = {
      totalCards: totalUsage.length > 0 ? totalUsage[0].totalCards : 0,
      thisMonth: currentUsage ? currentUsage.cardScansUsed : 0,
      lastMonth: lastMonthUsage ? lastMonthUsage.cardScansUsed : 0,
      planLimit: plan ? plan.cardScansLimit : 100,
      planType: plan ? plan.displayName : 'Free',
      planId: plan ? plan._id : null,
      planEndDate: planEndDate,
      daysRemaining: daysRemaining,
      isPlanExpired: isPlanExpired,
      recentActivity: recentActivity
    };

    res.json({
      success: true,
      data: usageData
    });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage data',
      error: error.message
    });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Check if user is demo user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Block password change for demo users
    if (user.isDemo) {
      return res.status(403).json({
        success: false,
        message: 'Password change is not allowed for demo accounts'
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('currentPlan', 'name cardScansLimit price')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, companyName, phoneNumber } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !companyName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, company name, and phone number are required'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        firstName, 
        lastName, 
        email: email.toLowerCase(),
        companyName,
        phoneNumber,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('currentPlan', 'name cardScansLimit price')
    .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Get user's processing history
const getProcessingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get processing history from usage records
    const history = await Usage.find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('plan', 'name')
      .select('cardScansUsed year month createdAt updatedAt');

    const total = await Usage.countDocuments({ user: new mongoose.Types.ObjectId(userId) });

    res.json({
      success: true,
      data: {
        history: history.map(record => ({
          id: record._id,
          type: 'processing',
          date: record.createdAt.toISOString().split('T')[0],
          status: 'completed',
          count: record.cardScansUsed,
          month: record.month,
          year: record.year,
          plan: record.plan.name
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching processing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processing history',
      error: error.message
    });
  }
};

// Send WhatsApp OTP
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber, fullName } = req.body;

    // Validation
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone;
    }

    // Create OTP record in database first
    const otpRecord = await OTP.createOTP(formattedPhone, fullName);
    
    // Send OTP via WhatsApp using the OTP from database
    const result = await whatsappOTPService.sendOTP(formattedPhone, fullName, otpRecord.otp);

    if (result.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phoneNumber: formattedPhone,
          messageId: result.messageId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to send OTP',
        details: result.details
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending OTP',
      error: error.message
    });
  }
};

// Verify WhatsApp OTP
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, fullName } = req.body;
    
    console.log('🔍 verifyOTP called with:', { phoneNumber, otp, fullName });

    // Validation
    if (!phoneNumber || !otp) {
      console.log('❌ Validation failed: missing phoneNumber or otp');
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone;
    }
    
    console.log('📱 Formatted phone number:', formattedPhone);

    // Check if user exists with this phone number FIRST
    let user = await User.findOne({ phoneNumber: formattedPhone });
    
    console.log('👤 User lookup result:', user ? {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isWhatsAppUser: user.isWhatsAppUser
    } : 'No user found');

    // Determine if this is a signup or login flow
    const isSignupFlow = fullName && fullName.trim() !== '';
    const isLoginFlow = !fullName || fullName.trim() === '';

    console.log('🔄 Flow detection:', { isSignupFlow, isLoginFlow, fullName });

    // If it's a login flow and user doesn't exist, return signup first error
    if (!user && isLoginFlow) {
      console.log('❌ Login attempt without signup');
      return res.status(400).json({
        success: false,
        message: 'Signup First to use our Service'
      });
    }

    // Verify OTP using the OTP model
    const verificationResult = await OTP.verifyOTP(formattedPhone, otp);
    console.log('✅ OTP verification result:', verificationResult);

    if (!verificationResult.success) {
      console.log('❌ OTP verification failed:', verificationResult.message);
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    if (!user && isSignupFlow) {
      // SIGNUP FLOW: Create new user if doesn't exist and fullName is provided
      console.log('📝 Creating new user (Signup flow)');
      
      const starterPlan = await Plan.findOne({ name: 'starter' });
      if (!starterPlan) {
        const defaultPlans = Plan.getDefaultPlans();
        await Plan.insertMany(defaultPlans);
      }
      
      const finalStarterPlan = await Plan.findOne({ name: 'starter' });
      
      const planStartDate = new Date();
      const planEndDate = new Date();
      planEndDate.setDate(planEndDate.getDate() + 30);

      user = new User({
        firstName: fullName.split(' ')[0] || fullName,
        lastName: fullName.split(' ').slice(1).join(' ') || '',
        email: `${formattedPhone}@whatsapp.user`, // Temporary email
        phoneNumber: formattedPhone,
        companyName: 'WhatsApp User',
        currentPlan: finalStarterPlan._id,
        planStartDate,
        planEndDate,
        isWhatsAppUser: true
      });

      await user.save();
      console.log('✅ New user created:', {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber
      });
      
    } else if (user && isLoginFlow) {
      // LOGIN FLOW: Update last login for existing user
      console.log('🔑 Updating existing user (Login flow)');
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isWhatsAppUser: user.isWhatsAppUser || false
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getUserUsage,
  changePassword,
  getUserProfile,
  updateUserProfile,
  getProcessingHistory,
  sendOTP,
  verifyOTP
};
