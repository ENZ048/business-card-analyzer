const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  month: {
    type: Number,
    required: true,
    default: () => new Date().getMonth() + 1
  },
  cardScansUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  cardScansLimit: {
    type: Number,
    required: true
  },
  activities: [{
    type: {
      type: String,
      enum: ['single', 'bulk'],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
usageSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

// Method to check if user can perform more scans
usageSchema.methods.canPerformScan = function() {
  if (this.cardScansLimit === -1) return true; // Unlimited plan
  return this.cardScansUsed < this.cardScansLimit;
};

// Method to get remaining scans
usageSchema.methods.getRemainingScans = function() {
  if (this.cardScansLimit === -1) return -1; // Unlimited
  return Math.max(0, this.cardScansLimit - this.cardScansUsed);
};

// Method to increment usage
usageSchema.methods.incrementUsage = function(count = 1, activityType = 'single') {
  this.cardScansUsed += count;
  this.activities.push({
    type: activityType,
    count: count,
    processedAt: new Date()
  });
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get or create usage record for user
usageSchema.statics.getOrCreateUsage = async function(userId, planId, cardScansLimit) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let usage = await this.findOne({ user: userId, year, month });
  
  if (!usage) {
    usage = new this({
      user: userId,
      plan: planId,
      year,
      month,
      cardScansLimit
    });
    await usage.save();
  } else if (usage.cardScansLimit !== cardScansLimit) {
    // Update limit if plan changed
    usage.cardScansLimit = cardScansLimit;
    await usage.save();
  }

  return usage;
};

// Static method to get user's current usage
usageSchema.statics.getCurrentUsage = async function(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return await this.findOne({ user: userId, year, month });
};

module.exports = mongoose.model('Usage', usageSchema);
