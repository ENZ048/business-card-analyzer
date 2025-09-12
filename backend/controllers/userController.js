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
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
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

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password
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
        role: user.role
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
      user: userId, 
      year: currentYear, 
      month: currentMonth 
    });

    // Get last month usage
    const lastMonthUsage = await Usage.findOne({ 
      user: userId, 
      year: lastMonthYear, 
      month: lastMonth 
    });

    // Get total usage across all time
    const totalUsage = await Usage.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalCards: { $sum: '$cardScansUsed' } } }
    ]);

    // Get user's current plan
    const user = await User.findById(userId).populate('currentPlan');
    const plan = user.currentPlan;

    // Get recent activity from all usage records
    const allUsageRecords = await Usage.find({ user: userId })
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

    // Calculate usage data
    const usageData = {
      totalCards: totalUsage.length > 0 ? totalUsage[0].totalCards : 0,
      thisMonth: currentUsage ? currentUsage.cardScansUsed : 0,
      lastMonth: lastMonthUsage ? lastMonthUsage.cardScansUsed : 0,
      planLimit: plan ? plan.cardScansLimit : 100,
      planType: plan ? plan.displayName : 'Free',
      planId: plan ? plan._id : null,
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
      data: user
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
    const { firstName, lastName, email } = req.body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
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
      data: user
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
    const history = await Usage.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('plan', 'name')
      .select('cardScansUsed year month createdAt updatedAt');

    const total = await Usage.countDocuments({ user: userId });

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
