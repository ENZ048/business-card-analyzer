require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || 'bd@troikatech.net').toLowerCase();

const setupDemoUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Desired demo user details
    const demoDetails = {
      firstName: 'Demo',
      lastName: 'User',
      email: DEMO_EMAIL,
      password: process.env.DEMO_USER_PASSWORD || 'p22gM27B7@iY',
      companyName: 'Troika',
      phoneNumber: '9373521595'
    };

    // Find existing by email
    let user = await User.findOne({ email: DEMO_EMAIL });

    if (!user) {
      // Create new demo user
      user = new User({
        ...demoDetails,
        isDemo: true,
        isActive: true,
        role: 'user',
        currentPlan: null,
        planStartDate: null,
        planEndDate: null
      });
      await user.save();
      console.log('🆕 Created new demo user');
    } else {
      // Update fields and mark as demo
      user.firstName = demoDetails.firstName;
      user.lastName = demoDetails.lastName;
      user.companyName = demoDetails.companyName;
      user.phoneNumber = demoDetails.phoneNumber;
      user.isDemo = true;
      user.isActive = true;
      // Reset password to known demo password
      user.password = demoDetails.password;
      // Clear plan to avoid plan-based limits
      user.currentPlan = null;
      user.planStartDate = null;
      user.planEndDate = null;
      await user.save();
      console.log('♻️  Updated existing demo user');
    }

    console.log('\n📋 Demo User Details:');
    console.log('- Name:', user.firstName, user.lastName);
    console.log('- Email:', user.email);
    console.log('- Company:', user.companyName);
    console.log('- Phone:', user.phoneNumber);
    console.log('- isDemo:', user.isDemo);
    console.log('- isActive:', user.isActive);
    console.log('- currentPlan:', user.currentPlan);
    console.log('- planStartDate:', user.planStartDate);
    console.log('- planEndDate:', user.planEndDate);

    console.log('\n✅ Demo user is ready!');
    console.log('\n🎯 Demo User Features:');
    console.log('- Gets 5 scans per login session');
    console.log('- Scans reset on each login');
    console.log('- No database usage tracking');
    console.log('- Session-based limits via JWT');
    console.log('\n📧 Credentials:');
    console.log('Email:', user.email);
    console.log('Password:', demoDetails.password);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setupDemoUser();

