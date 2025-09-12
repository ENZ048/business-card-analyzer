const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['starter', 'growth', 'pro', 'enterprise']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cardScansLimit: {
    type: Number,
    required: true
  },
  validityMonths: {
    type: Number,
    required: true,
    default: 12
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to get default plans
planSchema.statics.getDefaultPlans = function() {
  return [
    {
      name: 'starter',
      displayName: 'Starter Plan',
      description: 'Perfect for individuals and small businesses',
      cardScansLimit: 1000,
      validityMonths: 12,
      price: 0,
      features: [
        '1,000 card scans per year',
        'Basic OCR processing',
        'Export to CSV, XLSX, VCF',
        'QR code generation',
        'Email support'
      ],
      sortOrder: 1
    },
    {
      name: 'growth',
      displayName: 'Growth Plan',
      description: 'Ideal for growing businesses',
      cardScansLimit: 3000,
      validityMonths: 12,
      price: 29.99,
      features: [
        '3,000 card scans per year',
        'Advanced OCR processing',
        'Export to CSV, XLSX, VCF',
        'QR code generation',
        'Bulk processing',
        'Priority support'
      ],
      sortOrder: 2,
      isPopular: true
    },
    {
      name: 'pro',
      displayName: 'Pro Plan',
      description: 'For professional teams and agencies',
      cardScansLimit: 10000,
      validityMonths: 12,
      price: 79.99,
      features: [
        '10,000 card scans per year',
        'Premium OCR processing',
        'Export to CSV, XLSX, VCF',
        'QR code generation',
        'Bulk processing',
        'API access',
        'Priority support',
        'Custom integrations'
      ],
      sortOrder: 3
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'Unlimited power for large organizations',
      cardScansLimit: -1, // -1 means unlimited
      validityMonths: 12,
      price: 199.99,
      features: [
        'Unlimited card scans',
        'Premium OCR processing',
        'Export to CSV, XLSX, VCF',
        'QR code generation',
        'Bulk processing',
        'API access',
        'Dedicated support',
        'Custom integrations',
        'White-label options',
        'Advanced analytics'
      ],
      sortOrder: 4
    }
  ];
};

// Method to check if plan is unlimited
planSchema.methods.isUnlimited = function() {
  return this.cardScansLimit === -1;
};

module.exports = mongoose.model('Plan', planSchema);
