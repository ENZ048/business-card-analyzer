require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const testDemoLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find demo user by ID
    const demoUser = await User.findById('68e4a31e5ddc1d7b2ed5b5cf');

    if (!demoUser) {
      console.log('❌ Demo user not found');
      process.exit(1);
    }

    console.log('📋 Demo User Details:');
    console.log('- Email:', demoUser.email);
    console.log('- Name:', demoUser.firstName, demoUser.lastName);
    console.log('- isDemo:', demoUser.isDemo);
    console.log('- ID:', demoUser._id);

    if (!demoUser.isDemo) {
      console.log('\n⚠️  WARNING: User is not marked as demo!');
      process.exit(1);
    }

    // Simulate login - generate token with session scans
    const payload = { userId: demoUser._id };
    payload.sessionScans = 5; // Fresh session with 5 scans

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });

    console.log('\n🔑 Fresh JWT Token (with session scans):');
    console.log(token);

    // Decode to verify
    const decoded = jwt.decode(token);
    console.log('\n📦 Token Payload:');
    console.log(JSON.stringify(decoded, null, 2));

    console.log('\n✅ Token includes sessionScans:', decoded.sessionScans === 5 ? 'YES' : 'NO');
    console.log('\n💡 Use this token in your frontend or:');
    console.log('   1. Log out from the application');
    console.log('   2. Log back in with:', demoUser.email);
    console.log('   3. The new token will automatically include sessionScans: 5');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testDemoLogin();
