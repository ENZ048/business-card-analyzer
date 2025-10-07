require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const createDemoPlan = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if demo plan already exists
    const existingDemoPlan = await Plan.findOne({ name: 'demo' });
    if (existingDemoPlan) {
      console.log('⚠️  Demo plan already exists!');
      console.log('Demo Plan Details:', existingDemoPlan);
      process.exit(0);
    }

    // Create demo plan
    const demoPlan = new Plan({
      name: 'demo',
      displayName: 'Demo Plan',
      description: 'Demo plan with 5 card scans - no time limit',
      cardScansLimit: 5,
      validityMonths: 0, // No time limit
      price: 0,
      features: [
        '5 card scans total',
        'No time limit',
        'Basic OCR processing',
        'Export to CSV, XLSX, VCF',
        'QR code generation'
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 0 // First in the list
    });

    await demoPlan.save();
    console.log('✅ Demo plan created successfully!');
    console.log('Demo Plan Details:', {
      id: demoPlan._id,
      name: demoPlan.name,
      displayName: demoPlan.displayName,
      cardScansLimit: demoPlan.cardScansLimit,
      validityMonths: demoPlan.validityMonths
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo plan:', error);
    process.exit(1);
  }
};

createDemoPlan();
