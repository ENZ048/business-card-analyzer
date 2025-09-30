const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const checkUserPlanDates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      console.log('\n--- User Details ---');
      console.log('Email:', user.email);
      console.log('Current Plan:', user.currentPlan);
      console.log('Plan Start Date:', user.planStartDate);
      console.log('Plan End Date:', user.planEndDate);
      
      if (user.planEndDate) {
        const now = new Date();
        const timeDiff = user.planEndDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const isExpired = daysRemaining <= 0;
        
        console.log('Current Date:', now);
        console.log('Time Difference (ms):', timeDiff);
        console.log('Days Remaining:', daysRemaining);
        console.log('Is Expired:', isExpired);
        
        // If plan is expired, extend it by 30 days
        if (isExpired) {
          console.log('Plan is expired, extending by 30 days...');
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + 30);
          
          user.planStartDate = now;
          user.planEndDate = newEndDate;
          await user.save();
          
          console.log('Updated plan dates:');
          console.log('New Start Date:', user.planStartDate);
          console.log('New End Date:', user.planEndDate);
        }
      } else {
        console.log('No plan end date found, setting default 30-day trial...');
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + 30);
        
        user.planStartDate = now;
        user.planEndDate = endDate;
        await user.save();
        
        console.log('Set plan dates:');
        console.log('Start Date:', user.planStartDate);
        console.log('End Date:', user.planEndDate);
      }
    }

    console.log('\nAll users processed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error checking user plan dates:', error);
    process.exit(1);
  }
};

checkUserPlanDates();
