require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || 'bd@troikatech.net').toLowerCase();

const checkDemoUserToken = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: DEMO_EMAIL });

    if (!user) {
      console.log('❌ Demo user not found for email:', DEMO_EMAIL);
      console.log('Run: node scripts/setupDemoUser.js');
      process.exit(1);
    }

    console.log('📋 User Details:');
    console.log('- Email:', user.email);
    console.log('- Name:', user.firstName, user.lastName);
    console.log('- isDemo:', user.isDemo);

    // Generate a fresh JWT token with session scans
    const token = jwt.sign(
      { userId: user._id, sessionScans: 5 },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('\n🔑 Fresh Demo JWT Token:');
    console.log(token);

    // Decode and verify
    const decoded = jwt.decode(token);
    console.log('\n📦 Token Payload:');
    console.log(JSON.stringify(decoded, null, 2));

    console.log('\n✅ Verification:');
    console.log('- Has userId:', decoded.userId ? '✓' : '✗');
    console.log('- Has sessionScans:', decoded.sessionScans !== undefined ? '✓' : '✗');
    console.log('- sessionScans value:', decoded.sessionScans);

    console.log('\n🧪 Testing Instructions:');
    console.log('1. Log out from the application');
    console.log('2. Log in with: ' + user.email);
    console.log('3. Open browser DevTools → Console');
    console.log('4. Run: JSON.parse(atob(localStorage.getItem("token").split(".")[1]))');
    console.log('5. Check that sessionScans is present and equals 5');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkDemoUserToken();

