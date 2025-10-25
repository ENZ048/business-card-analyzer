const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');
require('dotenv').config();

const createWhatsAppAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Format phone number
    const phoneNumber = '919822667827'; // Already formatted with country code
    const fullName = 'Kishor Rane';

    // Check if user already exists
    let user = await User.findOne({ phoneNumber });
    
    if (user) {
      // Update existing user to admin
      user.role = 'admin';
      user.firstName = 'Kishor';
      user.lastName = 'Rane';
      user.isWhatsAppUser = true;
      user.isActive = true;
      await user.save();
      
      console.log('✅ Updated existing user to admin:', {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isWhatsAppUser: user.isWhatsAppUser
      });
    } else {
      // Create new admin user
      // Get or create starter plan
      let starterPlan = await Plan.findOne({ name: 'starter' });
      if (!starterPlan) {
        const defaultPlans = Plan.getDefaultPlans();
        await Plan.insertMany(defaultPlans);
        starterPlan = await Plan.findOne({ name: 'starter' });
      }

      const planStartDate = new Date();
      const planEndDate = new Date();
      planEndDate.setDate(planEndDate.getDate() + 30);

      user = new User({
        firstName: 'Kishor',
        lastName: 'Rane',
        email: `${phoneNumber}@whatsapp.admin`,
        phoneNumber: phoneNumber,
        companyName: 'Admin User',
        currentPlan: starterPlan._id,
        planStartDate,
        planEndDate,
        isWhatsAppUser: true,
        role: 'admin',
        isActive: true
      });

      await user.save();
      
      console.log('✅ Created new admin user:', {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isWhatsAppUser: user.isWhatsAppUser
      });
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('📱 Login Details:');
    console.log('   Phone Number: 9822667827');
    console.log('   Name: Kishor Rane');
    console.log('   Role: Admin');
    console.log('   Login Method: WhatsApp OTP');
    
    console.log('\n🔑 To login:');
    console.log('1. Go to the app');
    console.log('2. Enter phone number: 9822667827');
    console.log('3. Enter name: Kishor Rane');
    console.log('4. Click "Send OTP"');
    console.log('5. Enter the OTP received');
    console.log('6. You will be logged in as admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

// Run the script
createWhatsAppAdmin();
