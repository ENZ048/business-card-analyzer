const mongoose = require('mongoose');

const demoSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  sessionScans: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
demoSessionSchema.index({ userId: 1 });
demoSessionSchema.index({ lastActivity: 1 });

// Method to reset session scans to 5
demoSessionSchema.methods.resetSession = function() {
  this.sessionScans = 5;
  this.lastLogin = new Date();
  this.lastActivity = new Date();
  return this.save();
};

// Method to decrement session scans
demoSessionSchema.methods.decrementScans = function(count = 1) {
  this.sessionScans = Math.max(0, this.sessionScans - count);
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get or create session for user
demoSessionSchema.statics.getOrCreateSession = async function(userId) {
  let session = await this.findOne({ userId, isActive: true });
  
  if (!session) {
    // Create new session
    session = new this({
      userId,
      sessionScans: 5,
      lastLogin: new Date(),
      lastActivity: new Date()
    });
    await session.save();
  } else {
    // Update last activity
    session.lastActivity = new Date();
    await session.save();
  }
  
  return session;
};

// Static method to reset session on new login
demoSessionSchema.statics.resetSessionOnLogin = async function(userId) {
  let session = await this.findOne({ userId, isActive: true });
  
  if (!session) {
    // Create new session
    session = new this({
      userId,
      sessionScans: 5,
      lastLogin: new Date(),
      lastActivity: new Date()
    });
  } else {
    // Reset existing session
    session.sessionScans = 5;
    session.lastLogin = new Date();
    session.lastActivity = new Date();
  }
  
  await session.save();
  return session;
};

module.exports = mongoose.model('DemoSession', demoSessionSchema);
