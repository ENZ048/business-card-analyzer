const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fullName: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    index: true
  },
  phoneNumbers: [{
    type: String,
    trim: true
  }],
  emails: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  sourceMode: {
    type: String,
    enum: ['single', 'bulk'],
    default: 'single'
  },
  confidence: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for common queries
CardSchema.index({ userId: 1, scannedAt: -1 });

module.exports = mongoose.model('Card', CardSchema);
