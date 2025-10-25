const axios = require('axios');

const testSignupFirstFlow = async () => {
  try {
    console.log('🧪 Testing Complete Signup First Flow...\n');
    
    const testPhone = '9324777191';
    
    // Step 1: Send OTP for login (no fullName)
    console.log('📱 Step 1: Sending OTP for login (no fullName)...');
    const sendResponse = await axios.post('http://localhost:5000/api/users/send-otp', {
      phoneNumber: testPhone
    });
    
    console.log('✅ OTP sent successfully');
    console.log('📱 Phone:', sendResponse.data.data.phoneNumber);
    
    // Step 2: Try to verify OTP without signup (login flow)
    console.log('\n🔍 Step 2: Verifying OTP without signup (login flow)...');
    console.log('   This should show "Signup First to use our Service"');
    
    try {
      const verifyResponse = await axios.post('http://localhost:5000/api/users/verify-otp', {
        phoneNumber: testPhone,
        otp: '000000', // Dummy OTP
        fullName: null // Login flow
      });
      console.log('❌ Unexpected success:', verifyResponse.data);
    } catch (error) {
      if (error.response && error.response.data.message.includes('Signup First')) {
        console.log('✅ SUCCESS: Got "Signup First to use our Service" error!');
        console.log('📝 Message:', error.response.data.message);
        console.log('🎯 This should now trigger the custom popup in the frontend');
      } else {
        console.log('⚠️ Different error:', error.response?.data?.message || error.message);
      }
    }
    
    // Step 3: Test signup flow (with fullName)
    console.log('\n📝 Step 3: Testing signup flow (with fullName)...');
    try {
      const signupResponse = await axios.post('http://localhost:5000/api/users/verify-otp', {
        phoneNumber: testPhone,
        otp: '000000', // Dummy OTP
        fullName: 'Test User' // Signup flow
      });
      console.log('⚠️ Unexpected success:', signupResponse.data);
    } catch (error) {
      console.log('📝 Expected OTP error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Signup First flow test completed!');
    console.log('📱 The frontend should now show:');
    console.log('   1. Custom popup with "Signup Required" title');
    console.log('   2. Message: "Please sign up first to use our service..."');
    console.log('   3. Auto-close after 3 seconds');
    console.log('   4. Automatic redirect to signup form');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testSignupFirstFlow();
