require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'pratik.yesare68@gmail.com' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      process.exit(0);
    }

    // Create default plans if they don't exist
    const plans = await Plan.find();
    if (plans.length === 0) {
      console.log('📋 Creating default plans...');
      const defaultPlans = Plan.getDefaultPlans();
      await Plan.insertMany(defaultPlans);
      console.log('✅ Default plans created');
    }

    // Get starter plan
    const starterPlan = await Plan.findOne({ name: 'starter' });

    // Create admin user
    const adminUser = new User({
      email: 'pratik.yesare68@gmail.com',
      password: 'Pratik@2001',
      firstName: 'Pratik',
      lastName: 'Yesare',
      role: 'super_admin',
      currentPlan: starterPlan._id,
      planStartDate: new Date(),
      planEndDate: null // Never expiring for admin
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: pratik.yesare68@gmail.com');
    console.log('🔑 Password: Pratik@2001');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
