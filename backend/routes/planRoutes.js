const express = require('express');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Usage = require('../models/Usage');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/plans
// @desc    Get all available plans
// @access  Public
router.get('/', async (req, res) => {
  try {
    let plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });

    // If no plans exist, create default plans
    if (plans.length === 0) {
      const defaultPlans = Plan.getDefaultPlans();
      await Plan.insertMany(defaultPlans);
      plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
    }

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        cardScansLimit: plan.cardScansLimit,
        validityMonths: plan.validityMonths,
        price: plan.price,
        features: plan.features,
        isPopular: plan.isPopular,
        isUnlimited: plan.isUnlimited()
      }))
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      error: 'Server error while fetching plans'
    });
  }
});

// @route   GET /api/plans/current
// @desc    Get user's current plan and usage
// @access  Private
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('currentPlan');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get current usage
    const currentUsage = await Usage.getCurrentUsage(user._id);

    // Check if plan is expired
    const now = new Date();
    const isPlanExpired = user.planEndDate && user.planEndDate < now;

    res.json({
      success: true,
      currentPlan: user.currentPlan ? {
        id: user.currentPlan._id,
        name: user.currentPlan.name,
        displayName: user.currentPlan.displayName,
        description: user.currentPlan.description,
        cardScansLimit: user.currentPlan.cardScansLimit,
        validityMonths: user.currentPlan.validityMonths,
        price: user.currentPlan.price,
        features: user.currentPlan.features,
        isUnlimited: user.currentPlan.isUnlimited()
      } : null,
      planStartDate: user.planStartDate,
      planEndDate: user.planEndDate,
      isPlanExpired,
      usage: currentUsage ? {
        cardScansUsed: currentUsage.cardScansUsed,
        cardScansLimit: currentUsage.cardScansLimit,
        remainingScans: currentUsage.getRemainingScans(),
        canPerformScan: currentUsage.canPerformScan(),
        year: currentUsage.year,
        month: currentUsage.month
      } : null
    });
  } catch (error) {
    console.error('Get current plan error:', error);
    res.status(500).json({
      error: 'Server error while fetching current plan'
    });
  }
});

// @route   POST /api/plans/upgrade
// @desc    Upgrade user's plan
// @access  Private
router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        error: 'Plan ID is required'
      });
    }

    // Find the plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        error: 'Plan not found or inactive'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is already on this plan
    if (user.currentPlan && user.currentPlan.toString() === planId) {
      return res.status(400).json({
        error: 'You are already on this plan'
      });
    }

    // Update user's plan
    user.currentPlan = plan._id;
    user.planStartDate = new Date();
    user.planEndDate = new Date();
    user.planEndDate.setFullYear(user.planEndDate.getFullYear() + 1);
    await user.save();

    // Create or update usage record
    await Usage.getOrCreateUsage(user._id, plan._id, plan.cardScansLimit);

    res.json({
      success: true,
      message: 'Plan upgraded successfully',
      newPlan: {
        id: plan._id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        cardScansLimit: plan.cardScansLimit,
        validityMonths: plan.validityMonths,
        price: plan.price,
        features: plan.features,
        isUnlimited: plan.isUnlimited()
      },
      planStartDate: user.planStartDate,
      planEndDate: user.planEndDate
    });
  } catch (error) {
    console.error('Plan upgrade error:', error);
    res.status(500).json({
      error: 'Server error while upgrading plan'
    });
  }
});

// @route   GET /api/plans/usage
// @desc    Get user's usage history
// @access  Private
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const usageHistory = await Usage.find({ 
      user: req.user._id,
      year: parseInt(year)
    }).populate('plan', 'name displayName cardScansLimit').sort({ month: 1 });

    res.json({
      success: true,
      usageHistory: usageHistory.map(usage => ({
        id: usage._id,
        year: usage.year,
        month: usage.month,
        cardScansUsed: usage.cardScansUsed,
        cardScansLimit: usage.cardScansLimit,
        remainingScans: usage.getRemainingScans(),
        plan: usage.plan ? {
          name: usage.plan.name,
          displayName: usage.plan.displayName,
          cardScansLimit: usage.plan.cardScansLimit
        } : null,
        lastResetDate: usage.lastResetDate
      }))
    });
  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({
      error: 'Server error while fetching usage history'
    });
  }
});

// @route   POST /api/plans/check-usage
// @desc    Check if user can perform a scan
// @access  Private
router.post('/check-usage', authMiddleware, async (req, res) => {
  try {
    const { scanCount = 1 } = req.body;

    const user = await User.findById(req.user._id).populate('currentPlan');
    if (!user || !user.currentPlan) {
      return res.status(400).json({
        error: 'No active plan found'
      });
    }

    // Check if plan is expired
    const now = new Date();
    if (user.planEndDate && user.planEndDate < now) {
      return res.status(400).json({
        error: 'Your plan has expired. Please upgrade to continue.',
        canPerformScan: false,
        isPlanExpired: true
      });
    }

    // Get current usage
    const currentUsage = await Usage.getOrCreateUsage(
      user._id, 
      user.currentPlan._id, 
      user.currentPlan.cardScansLimit
    );

    const canPerformScan = currentUsage.canPerformScan() && 
                          (currentUsage.cardScansUsed + scanCount) <= currentUsage.cardScansLimit;

    res.json({
      success: true,
      canPerformScan,
      currentUsage: {
        cardScansUsed: currentUsage.cardScansUsed,
        cardScansLimit: currentUsage.cardScansLimit,
        remainingScans: currentUsage.getRemainingScans(),
        requestedScans: scanCount
      },
      plan: {
        name: user.currentPlan.name,
        displayName: user.currentPlan.displayName,
        isUnlimited: user.currentPlan.isUnlimited()
      }
    });
  } catch (error) {
    console.error('Check usage error:', error);
    res.status(500).json({
      error: 'Server error while checking usage'
    });
  }
});

module.exports = router;
