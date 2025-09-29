require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-card-analyzer';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get command line arguments
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];
    const firstName = args[2] || 'Super';
    const lastName = args[3] || 'Admin';

    if (!email || !password) {
      console.log('❌ Usage: node createSuperAdmin.js <email> <password> [firstName] [lastName]');
      console.log('📝 Example: node createSuperAdmin.js admin@example.com AdminPass123 John Doe');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log('❌ Admin user already exists with this email');
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

    // Create super admin user with default values for new required fields
    const adminUser = new User({
      email: email.toLowerCase(),
      password: password,
      firstName: firstName,
      lastName: lastName,
      companyName: 'Admin Company', // Default value for required field
      phoneNumber: '000-000-0000', // Default value for required field
      role: 'super_admin',
      currentPlan: starterPlan._id,
      planStartDate: new Date(),
      planEndDate: null // Never expiring for admin
    });

    await adminUser.save();
    console.log('✅ Super Admin user created successfully');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin user:', error);
    process.exit(1);
  }
};

createSuperAdmin();
