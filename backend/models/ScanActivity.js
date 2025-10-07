const mongoose = require('mongoose');

const ScanActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  scanCount: {
    type: Number,
    required: true,
    min: 1
  },
  scanType: {
    type: String,
    enum: ['single', 'bulk'],
    required: true
  },
  filesProcessed: {
    type: Number,
    required: true,
    min: 1
  },
  sessionScansRemaining: {
    type: Number,
    required: true,
    min: 0
  },
  scanDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ScanActivitySchema.index({ userId: 1, scanDate: -1 });
ScanActivitySchema.index({ sessionId: 1 });
ScanActivitySchema.index({ scanDate: -1 });

// Static method to get scan activities with pagination
ScanActivitySchema.statics.getScanActivities = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const activities = await this.find({ userId })
    .sort({ scanDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments({ userId });
  const totalPages = Math.ceil(total / limit);
  
  return {
    activities,
    pagination: {
      currentPage: page,
      totalPages,
      totalActivities: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    }
  };
};

// Static method to get all scan activities with pagination (for admin)
ScanActivitySchema.statics.getAllScanActivities = async function(page = 1, limit = 20, userId = null) {
  const skip = (page - 1) * limit;
  const filter = userId ? { userId } : {};
  
  const activities = await this.find(filter)
    .populate('userId', 'firstName lastName email')
    .sort({ scanDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);
  
  return {
    activities,
    pagination: {
      currentPage: page,
      totalPages,
      totalActivities: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    }
  };
};

const ScanActivity = mongoose.model('ScanActivity', ScanActivitySchema);

module.exports = ScanActivity;
