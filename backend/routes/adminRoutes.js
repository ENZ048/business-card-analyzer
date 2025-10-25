const express = require('express');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Usage = require('../models/Usage');
const { adminMiddleware, superAdminMiddleware } = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get total users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const whatsappUsers = await User.countDocuments({ isWhatsAppUser: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      }
    });

    // Get plan distribution
    const planDistribution = await User.aggregate([
      { $match: { currentPlan: { $exists: true } } },
      { $group: { _id: '$currentPlan', count: { $sum: 1 } } },
      { $lookup: { from: 'plans', localField: '_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $project: { planName: '$plan.displayName', count: 1 } }
    ]);

    // Get total scans this month
    const totalScansThisMonth = await Usage.aggregate([
      { $match: { year: currentYear, month: currentMonth } },
      { $group: { _id: null, totalScans: { $sum: '$cardScansUsed' } } }
    ]);

    // Get usage trends (last 6 months)
    const usageTrends = await Usage.aggregate([
      {
        $match: {
          year: currentYear,
          month: { $gte: currentMonth - 5, $lte: currentMonth }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalScans: { $sum: '$cardScansUsed' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          month: '$_id.month',
          totalScans: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Get recent users
    const recentUsers = await User.find()
      .populate('currentPlan', 'displayName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email phoneNumber role isActive createdAt currentPlan isWhatsAppUser');

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        whatsappUsers,
        newUsersThisMonth,
        totalScansThisMonth: totalScansThisMonth[0]?.totalScans || 0,
        planDistribution,
        usageTrends
      },
      recentUsers
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      error: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const isActive = req.query.isActive;
    const isWhatsAppUser = req.query.isWhatsAppUser;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isWhatsAppUser !== undefined) filter.isWhatsAppUser = isWhatsAppUser === 'true';

    const users = await User.find(filter)
      .populate('currentPlan', 'displayName cardScansLimit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password');

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details with usage history
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('currentPlan')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get usage history
    const usageHistory = await Usage.find({ user: user._id })
      .populate('plan', 'displayName cardScansLimit')
      .sort({ year: -1, month: -1 });

    // Get current usage
    const currentUsage = await Usage.getCurrentUsage(user._id);

    res.json({
      success: true,
      user,
      usageHistory,
      currentUsage
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: 'Server error while fetching user details'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive, currentPlan } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already exists'
        });
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    // Handle plan change
    if (currentPlan !== undefined) {
      if (currentPlan === '' || currentPlan === null) {
        // Remove plan
        user.currentPlan = null;
        user.planStartDate = null;
        user.planEndDate = null;
      } else {
        // Assign new plan
        const plan = await Plan.findById(currentPlan);
        if (!plan) {
          return res.status(400).json({
            error: 'Invalid plan selected'
          });
        }

        user.currentPlan = currentPlan;
        user.planStartDate = new Date();

        // Set plan end date based on plan's validity
        if (plan.validityMonths === 0) {
          // No expiration (demo plan)
          user.planEndDate = null;
        } else {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + plan.validityMonths);
          user.planEndDate = endDate;
        }
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        currentPlan: user.currentPlan
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (hard delete - permanently removes from database)
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Prevent deleting super admins (only super admins can delete super admins)
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Only super admins can delete super admin accounts'
      });
    }

    // Delete associated usage records
    await Usage.deleteMany({ user: user._id });

    // Hard delete - permanently remove from database
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted permanently'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Server error while deleting user'
    });
  }
});

// @route   GET /api/admin/plans
// @desc    Get all plans for admin management
// @access  Admin
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1 });

    // Get plan usage statistics
    const planStats = await User.aggregate([
      { $match: { currentPlan: { $exists: true } } },
      { $group: { _id: '$currentPlan', userCount: { $sum: 1 } } },
      { $lookup: { from: 'plans', localField: '_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $project: { planName: '$plan.displayName', userCount: 1 } }
    ]);

    res.json({
      success: true,
      plans,
      planStats
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      error: 'Server error while fetching plans'
    });
  }
});

// @route   PUT /api/admin/plans/:id
// @desc    Update plan details
// @access  Super Admin
router.put('/plans/:id', superAdminMiddleware, async (req, res) => {
  try {
    const { displayName, description, cardScansLimit, price, features, isActive, isPopular } = req.body;
    
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found'
      });
    }

    if (displayName) plan.displayName = displayName;
    if (description) plan.description = description;
    if (cardScansLimit !== undefined) plan.cardScansLimit = cardScansLimit;
    if (price !== undefined) plan.price = price;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    if (isPopular !== undefined) plan.isPopular = isPopular;

    await plan.save();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      error: 'Server error while updating plan'
    });
  }
});

// @route   GET /api/admin/usage
// @desc    Get usage analytics
// @access  Admin
router.get('/usage', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    let matchFilter = { year: parseInt(year) };
    if (month) matchFilter.month = parseInt(month);

    // Get usage statistics
    const usageStats = await Usage.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalScans: { $sum: '$cardScansUsed' },
          totalUsers: { $addToSet: '$user' },
          averageScansPerUser: { $avg: '$cardScansUsed' }
        }
      },
      {
        $project: {
          totalScans: 1,
          totalUsers: { $size: '$totalUsers' },
          averageScansPerUser: { $round: ['$averageScansPerUser', 2] }
        }
      }
    ]);

    // Get monthly usage trends
    const monthlyTrends = await Usage.aggregate([
      { $match: { year: parseInt(year) } },
      {
        $group: {
          _id: { month: '$month' },
          totalScans: { $sum: '$cardScansUsed' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          month: '$_id.month',
          totalScans: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Get top users by usage
    const topUsers = await Usage.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$user',
          totalScans: { $sum: '$cardScansUsed' }
        }
      },
      { $sort: { totalScans: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          user: {
            firstName: 1,
            lastName: 1,
            email: 1
          },
          totalScans: 1
        }
      }
    ]);

    res.json({
      success: true,
      usageStats: usageStats[0] || { totalScans: 0, totalUsers: 0, averageScansPerUser: 0 },
      monthlyTrends,
      topUsers
    });
  } catch (error) {
    console.error('Get usage analytics error:', error);
    res.status(500).json({
      error: 'Server error while fetching usage analytics'
    });
  }
});

// @route   POST /api/admin/users/:id/reset-usage
// @desc    Reset user's usage for current month
// @access  Super Admin
router.post('/users/:id/reset-usage', superAdminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const usage = await Usage.findOne({ user: user._id, year, month });
    if (usage) {
      usage.cardScansUsed = 0;
      await usage.save();
    }

    res.json({
      success: true,
      message: 'User usage reset successfully'
    });
  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({
      error: 'Server error while resetting usage'
    });
  }
});

// @route   GET /api/admin/whatsapp-users
// @desc    Get WhatsApp users statistics and list
// @access  Admin
router.get('/whatsapp-users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    // Build filter for WhatsApp users
    const filter = { isWhatsAppUser: true };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Get WhatsApp users
    const whatsappUsers = await User.find(filter)
      .populate('currentPlan', 'displayName cardScansLimit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password');

    const totalWhatsAppUsers = await User.countDocuments(filter);

    // Get WhatsApp user statistics
    const whatsappStats = await User.aggregate([
      { $match: { isWhatsAppUser: true } },
      {
        $group: {
          _id: null,
          totalWhatsAppUsers: { $sum: 1 },
          activeWhatsAppUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          newThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                    { $lt: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get WhatsApp users by month (last 6 months)
    const whatsappTrends = await User.aggregate([
      {
        $match: {
          isWhatsAppUser: true,
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      whatsappUsers,
      stats: whatsappStats[0] || {
        totalWhatsAppUsers: 0,
        activeWhatsAppUsers: 0,
        newThisMonth: 0
      },
      trends: whatsappTrends,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalWhatsAppUsers / limit),
        totalUsers: totalWhatsAppUsers,
        hasNext: page < Math.ceil(totalWhatsAppUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get WhatsApp users error:', error);
    res.status(500).json({
      error: 'Server error while fetching WhatsApp users'
    });
  }
});

// Demo user management routes
const DemoSession = require('../models/DemoSession');
const ScanActivity = require('../models/ScanActivity');

// @route   GET /api/admin/demo-users
// @desc    Get demo users with session information
// @access  Admin
router.get('/demo-users', async (req, res) => {
  try {
    // Get all demo users
    const demoUsers = await User.find({ isDemo: true })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get session information for each demo user
    const demoUsersWithSessions = await Promise.all(
      demoUsers.map(async (user) => {
        const session = await DemoSession.findOne({ userId: user._id, isActive: true });
        return {
          ...user.toObject(),
          sessionScans: session ? session.sessionScans : 0,
          lastLogin: session ? session.lastLogin : null,
          lastActivity: session ? session.lastActivity : null,
          sessionCreated: session ? session.createdAt : null
        };
      })
    );

    res.json({
      success: true,
      demoUsers: demoUsersWithSessions
    });
  } catch (error) {
    console.error('Get demo users error:', error);
    res.status(500).json({
      error: 'Server error while fetching demo users'
    });
  }
});

// @route   GET /api/admin/demo-users/:id/scan-history
// @desc    Get scan history for a specific demo user with pagination
// @access  Admin
router.get('/demo-users/:id/scan-history', async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Verify user is demo user
    const user = await User.findById(userId);
    if (!user || !user.isDemo) {
      return res.status(404).json({
        error: 'Demo user not found'
      });
    }

    // Get current session
    const currentSession = await DemoSession.findOne({ userId, isActive: true });
    
    // Get scan activities with pagination
    const scanHistory = await ScanActivity.getScanActivities(userId, page, limit);

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isDemo: user.isDemo
      },
      currentSession: currentSession ? {
        sessionScans: currentSession.sessionScans,
        lastLogin: currentSession.lastLogin,
        lastActivity: currentSession.lastActivity,
        createdAt: currentSession.createdAt,
        updatedAt: currentSession.updatedAt
      } : null,
      scanHistory: scanHistory.activities.map(activity => ({
        id: activity._id,
        sessionId: activity.sessionId,
        scanCount: activity.scanCount,
        scanType: activity.scanType,
        filesProcessed: activity.filesProcessed,
        sessionScansRemaining: activity.sessionScansRemaining,
        scanDate: activity.scanDate,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent
      })),
      pagination: scanHistory.pagination
    });
  } catch (error) {
    console.error('Get demo user scan history error:', error);
    res.status(500).json({
      error: 'Server error while fetching scan history'
    });
  }
});

// @route   GET /api/admin/scan-activities
// @desc    Get all scan activities with pagination (for admin overview)
// @access  Admin
router.get('/scan-activities', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId || null;
    
    // Get scan activities with pagination
    const scanActivities = await ScanActivity.getAllScanActivities(page, limit, userId);

    res.json({
      success: true,
      scanActivities: scanActivities.activities.map(activity => ({
        id: activity._id,
        user: activity.userId ? {
          id: activity.userId._id,
          name: `${activity.userId.firstName} ${activity.userId.lastName}`,
          email: activity.userId.email
        } : null,
        sessionId: activity.sessionId,
        scanCount: activity.scanCount,
        scanType: activity.scanType,
        filesProcessed: activity.filesProcessed,
        sessionScansRemaining: activity.sessionScansRemaining,
        scanDate: activity.scanDate,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent
      })),
      pagination: scanActivities.pagination
    });
  } catch (error) {
    console.error('Get scan activities error:', error);
    res.status(500).json({
      error: 'Server error while fetching scan activities'
    });
  }
});

// @route   POST /api/admin/demo-users/:id/reset-session
// @desc    Reset demo user session (give them 5 new scans)
// @access  Admin
router.post('/demo-users/:id/reset-session', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verify user is demo user
    const user = await User.findById(userId);
    if (!user || !user.isDemo) {
      return res.status(404).json({
        error: 'Demo user not found'
      });
    }

    // Reset session
    const session = await DemoSession.resetSessionOnLogin(userId);

    res.json({
      success: true,
      message: 'Demo user session reset successfully',
      session: {
        sessionScans: session.sessionScans,
        lastLogin: session.lastLogin,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Reset demo user session error:', error);
    res.status(500).json({
      error: 'Server error while resetting session'
    });
  }
});

module.exports = router;
