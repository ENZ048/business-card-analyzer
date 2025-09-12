require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Usage = require('../models/Usage');

const createTestData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all plans
    const plans = await Plan.find();
    if (plans.length === 0) {
      console.log('❌ No plans found. Please run createAdmin.js first to create default plans.');
      process.exit(1);
    }

    const starterPlan = plans.find(p => p.name === 'starter');
    const growthPlan = plans.find(p => p.name === 'growth');
    const proPlan = plans.find(p => p.name === 'pro');

    // Test users data
    const testUsers = [
      {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        currentPlan: starterPlan._id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        currentPlan: growthPlan._id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'mike.johnson@example.com',
        password: 'password123',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'user',
        currentPlan: proPlan._id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'sarah.wilson@example.com',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'user',
        currentPlan: starterPlan._id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'david.brown@example.com',
        password: 'password123',
        firstName: 'David',
        lastName: 'Brown',
        role: 'user',
        currentPlan: growthPlan._id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ];

    console.log('📋 Creating test users...');
    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }

      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    }

    console.log('📊 Creating usage data...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Create usage data for each user
    for (const user of createdUsers) {
      const plan = plans.find(p => p._id.toString() === user.currentPlan.toString());
      
      // Create usage for current month with sample activities
      const cardScansUsed = Math.floor(Math.random() * (plan.cardScansLimit === -1 ? 100 : plan.cardScansLimit * 0.3));
      
      // Create sample activities
      const activities = [];
      let remainingScans = cardScansUsed;
      
      // Add some single card activities
      const singleActivities = Math.floor(Math.random() * 3) + 1; // 1-3 single activities
      for (let i = 0; i < singleActivities && remainingScans > 0; i++) {
        activities.push({
          type: 'single',
          count: 1,
          processedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
        });
        remainingScans -= 1;
      }
      
      // Add bulk activities if there are remaining scans
      while (remainingScans > 0) {
        const bulkCount = Math.min(remainingScans, Math.floor(Math.random() * 5) + 2); // 2-6 cards per bulk
        activities.push({
          type: 'bulk',
          count: bulkCount,
          processedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
        });
        remainingScans -= bulkCount;
      }
      
      const usage = new Usage({
        user: user._id,
        plan: user.currentPlan,
        year: currentYear,
        month: currentMonth,
        cardScansUsed: cardScansUsed,
        cardScansLimit: plan.cardScansLimit,
        activities: activities
      });

      await usage.save();
      console.log(`✅ Created usage for ${user.firstName} ${user.lastName}: ${usage.cardScansUsed}/${usage.cardScansLimit} scans (${activities.length} activities)`);
    }

    console.log('🎉 Test data created successfully!');
    console.log('\n📋 Test Users Created:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} (Password: password123)`);
    });

    console.log('\n🔑 Admin Login:');
    console.log('Email: pratik.yesare68@gmail.com');
    console.log('Password: Pratik@2001');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
};

createTestData();
