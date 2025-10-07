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
      .select('firstName lastName email role isActive createdAt currentPlan');

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
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

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

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

// @route   GET /api/admin/demo-users
// @desc    Get all demo users
// @access  Admin
router.get('/demo-users', async (req, res) => {
  try {
    const demoUsers = await User.find({ isDemo: true })
      .sort({ createdAt: -1 })
      .select('-password');

    res.json({
      success: true,
      demoUsers
    });
  } catch (error) {
    console.error('Get demo users error:', error);
    res.status(500).json({
      error: 'Server error while fetching demo users'
    });
  }
});

// @route   POST /api/admin/demo-users
// @desc    Create a new demo user with demo plan (5 card scans, no time limit)
// @access  Admin
router.post('/demo-users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    // Find the demo plan
    const demoPlan = await Plan.findOne({ name: 'demo' });
    if (!demoPlan) {
      return res.status(500).json({
        error: 'Demo plan not found. Please run createDemoPlan.js script first.'
      });
    }

    // Create demo user with demo plan (5 card scans, no time limit)
    // companyName and phoneNumber are optional
    const demoUser = new User({
      email,
      password,
      firstName,
      lastName,
      companyName: companyName || 'Demo Company',
      phoneNumber: phoneNumber || '000-000-0000',
      isDemo: true,
      demoCardScans: 5,
      currentPlan: demoPlan._id,
      planStartDate: new Date(),
      planEndDate: null, // No expiration for demo plan
      role: 'user',
      isActive: true
    });

    await demoUser.save();

    res.status(201).json({
      success: true,
      message: 'Demo user created successfully with 5 card scans (no time limit)',
      demoUser: {
        id: demoUser._id,
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        companyName: demoUser.companyName,
        phoneNumber: demoUser.phoneNumber,
        isDemo: demoUser.isDemo,
        demoCardScans: demoUser.demoCardScans,
        currentPlan: demoPlan.displayName
      }
    });
  } catch (error) {
    console.error('Create demo user error:', error);
    res.status(500).json({
      error: 'Server error while creating demo user'
    });
  }
});

// @route   PUT /api/admin/demo-users/:id
// @desc    Update demo user details
// @access  Admin
router.put('/demo-users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, phoneNumber, demoCardScans, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'Demo user not found'
      });
    }

    if (!user.isDemo) {
      return res.status(400).json({
        error: 'User is not a demo user'
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
    if (companyName) user.companyName = companyName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (demoCardScans !== undefined) user.demoCardScans = demoCardScans;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'Demo user updated successfully',
      demoUser: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        demoCardScans: user.demoCardScans,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update demo user error:', error);
    res.status(500).json({
      error: 'Server error while updating demo user'
    });
  }
});

// @route   DELETE /api/admin/demo-users/:id
// @desc    Delete demo user (hard delete - permanently removes from database)
// @access  Admin
router.delete('/demo-users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'Demo user not found'
      });
    }

    if (!user.isDemo) {
      return res.status(400).json({
        error: 'User is not a demo user'
      });
    }

    // Delete associated usage records
    await Usage.deleteMany({ user: user._id });

    // Hard delete - permanently remove from database
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Demo user deleted permanently'
    });
  } catch (error) {
    console.error('Delete demo user error:', error);
    res.status(500).json({
      error: 'Server error while deleting demo user'
    });
  }
});

module.exports = router;
