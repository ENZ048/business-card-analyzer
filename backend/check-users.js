// Quick check script to list all users in database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({}).select('phoneNumber firstName lastName isWhatsAppUser');
    console.log('\n📋 All users in database:');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Phone: ${user.phoneNumber}`);
        console.log(`   WhatsApp User: ${user.isWhatsAppUser}`);
        console.log('');
      });
    }
    
    console.log('=====================================');
    console.log(`Total users: ${users.length}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();

