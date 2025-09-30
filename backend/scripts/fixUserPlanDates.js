const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const fixUserPlanDates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users without planEndDate
    const usersWithoutPlanDate = await User.find({
      $or: [
        { planEndDate: { $exists: false } },
        { planEndDate: null }
      ]
    });

    console.log(`Found ${usersWithoutPlanDate.length} users without plan dates`);

    // Update each user with default 30-day trial
    for (const user of usersWithoutPlanDate) {
      const now = new Date();
      const planEndDate = new Date();
      planEndDate.setDate(now.getDate() + 30);

      user.planStartDate = now;
      user.planEndDate = planEndDate;
      await user.save();

      console.log(`Updated user ${user.email} with plan dates:`, {
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate
      });
    }

    console.log('All users updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user plan dates:', error);
    process.exit(1);
  }
};

fixUserPlanDates();
