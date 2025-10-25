const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  fullName: {
    type: String,
    default: null
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster lookups
otpSchema.index({ phoneNumber: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// Static method to create and save OTP
otpSchema.statics.createOTP = async function(phoneNumber, fullName = null) {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create OTP record
  const otpRecord = new this({
    phoneNumber,
    otp,
    fullName,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  });
  
  await otpRecord.save();
  return otpRecord;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(phoneNumber, providedOTP) {
  console.log('🔍 OTP.verifyOTP called with:', { phoneNumber, providedOTP });
  
  // Find the most recent unused OTP for this phone number
  const otpRecord = await this.findOne({
    phoneNumber,
    isUsed: false,
    expiresAt: { $gt: new Date() } // Not expired
  }).sort({ createdAt: -1 });

  console.log('📱 Found OTP record:', otpRecord ? {
    phoneNumber: otpRecord.phoneNumber,
    otp: otpRecord.otp,
    isUsed: otpRecord.isUsed,
    expiresAt: otpRecord.expiresAt,
    createdAt: otpRecord.createdAt
  } : null);

  if (!otpRecord) {
    console.log('❌ No valid OTP record found');
    return { success: false, message: 'Invalid or expired OTP' };
  }

  // Check if the provided OTP matches the stored OTP
  if (otpRecord.otp !== providedOTP) {
    console.log('❌ OTP mismatch:', { provided: providedOTP, stored: otpRecord.otp });
    return { success: false, message: 'Invalid OTP' };
  }

  // Mark OTP as used
  otpRecord.isUsed = true;
  await otpRecord.save();
  console.log('✅ OTP verified and marked as used');

  return { 
    success: true, 
    message: 'OTP verified successfully',
    fullName: otpRecord.fullName
  };
};

module.exports = mongoose.model('OTP', otpSchema);
