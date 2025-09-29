require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const fixExistingUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-card-analyzer';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find users missing the new required fields
    const usersToFix = await User.find({
      $or: [
        { companyName: { $exists: false } },
        { phoneNumber: { $exists: false } },
        { companyName: null },
        { phoneNumber: null }
      ]
    });

    console.log(`📊 Found ${usersToFix.length} users that need to be updated`);

    if (usersToFix.length === 0) {
      console.log('✅ All users already have the required fields');
      process.exit(0);
    }

    // Update each user with default values
    for (const user of usersToFix) {
      const updateData = {};
      
      if (!user.companyName) {
        updateData.companyName = user.role === 'super_admin' || user.role === 'admin' 
          ? 'Admin Company' 
          : 'User Company';
      }
      
      if (!user.phoneNumber) {
        updateData.phoneNumber = '000-000-0000';
      }

      await User.findByIdAndUpdate(user._id, updateData);
      console.log(`✅ Updated user: ${user.email}`);
    }

    console.log(`✅ Successfully updated ${usersToFix.length} users`);
    console.log('📝 Note: Users should update their company name and phone number in their profile');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing existing users:', error);
    process.exit(1);
  }
};

fixExistingUsers();
