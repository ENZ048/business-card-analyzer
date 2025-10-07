require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || 'bd@troikatech.net').toLowerCase();

const setDemoUser = async (identifier) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let user;
    if (identifier && identifier.includes && identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() }).populate('currentPlan');
    } else if (identifier) {
      user = await User.findById(identifier).populate('currentPlan');
    } else {
      user = await User.findOne({ email: DEMO_EMAIL }).populate('currentPlan');
    }

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('Current user details:');
    console.log('- Email:', user.email);
    console.log('- Name:', user.firstName, user.lastName);
    console.log('- isDemo:', user.isDemo);
    console.log('- Current Plan:', user.currentPlan?.displayName || 'None');

    // Update to demo account
    user.isDemo = true;
    await user.save();

    console.log('\n✅ User updated to demo account successfully!');
    console.log('\nDemo account credentials:');
    console.log('Email:', user.email);
    console.log('This account now resets to 5 scans on each login session.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get identifier (email or id) from command line argument
const identifier = process.argv[2] || DEMO_EMAIL;
setDemoUser(identifier);
