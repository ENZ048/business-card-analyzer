require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Usage = require('../models/Usage');

const deleteTestData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test user emails that were created
    const testUserEmails = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'mike.johnson@example.com',
      'sarah.wilson@example.com',
      'david.brown@example.com'
    ];

    console.log('🗑️  Deleting test data...');

    // Find and delete test users
    const testUsers = await User.find({ email: { $in: testUserEmails } });
    console.log(`📋 Found ${testUsers.length} test users to delete`);

    if (testUsers.length > 0) {
      // Get user IDs for usage deletion
      const userIds = testUsers.map(user => user._id);

      // Delete usage data for test users
      const deletedUsage = await Usage.deleteMany({ user: { $in: userIds } });
      console.log(`📊 Deleted ${deletedUsage.deletedCount} usage records`);

      // Delete test users
      const deletedUsers = await User.deleteMany({ email: { $in: testUserEmails } });
      console.log(`👥 Deleted ${deletedUsers.deletedCount} test users`);

      // List deleted users
      console.log('\n🗑️  Deleted Users:');
      testUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email}`);
      });
    } else {
      console.log('ℹ️  No test users found to delete');
    }

    // Also clean up any uploaded files from test users (if any)
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`📁 Found ${files.length} files in uploads directory`);
      
      // Note: We're not deleting upload files as they might be from real users
      // If you want to clean uploads, uncomment the following lines:
      /*
      let deletedFiles = 0;
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedFiles++;
        } catch (error) {
          console.log(`⚠️  Could not delete file ${file}: ${error.message}`);
        }
      });
      console.log(`📁 Deleted ${deletedFiles} uploaded files`);
      */
    }

    console.log('\n✅ Test data cleanup completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`- Deleted ${testUsers.length} test users`);
    console.log(`- Deleted ${testUsers.length > 0 ? (await Usage.countDocuments({ user: { $in: testUsers.map(u => u._id) } })) : 0} usage records`);
    console.log('- Upload files preserved (uncomment code in script to delete them)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting test data:', error);
    process.exit(1);
  }
};

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will delete all test data including:');
console.log('- Test users (john.doe@example.com, jane.smith@example.com, etc.)');
console.log('- Associated usage records');
console.log('- This action cannot be undone!');
console.log('');

rl.question('Are you sure you want to delete test data? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    deleteTestData();
  } else {
    console.log('❌ Operation cancelled');
    rl.close();
    process.exit(0);
  }
});
