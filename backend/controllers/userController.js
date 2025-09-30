const mongoose = require('mongoose');
const User = require('../models/User');
const Usage = require('../models/Usage');
const Plan = require('../models/Plan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
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

    // Generate token
    const token = generateToken(user._id);

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
        role: user.role
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

    // Get user's current plan
    const user = await User.findById(userId).populate('currentPlan');
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

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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

module.exports = {
  register,
  login,
  getUserUsage,
  changePassword,
  getUserProfile,
  updateUserProfile,
  getProcessingHistory
};
