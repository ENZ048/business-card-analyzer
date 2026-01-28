// Update user to be a WhatsApp user
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateUserToWhatsApp() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userId = '68da71eac64e28792c3de7f3';
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found with ID:', userId);
    } else {
      console.log('\n👤 Before Update:');
      console.log('================');
      console.log('Is WhatsApp User:', user.isWhatsAppUser);

      // Update to WhatsApp user
      user.isWhatsAppUser = true;
      await user.save();

      console.log('\n✅ After Update:');
      console.log('================');
      console.log('Is WhatsApp User:', user.isWhatsAppUser);
      console.log('User successfully updated to WhatsApp user!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserToWhatsApp();