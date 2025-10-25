const axios = require('axios');

const testSignupValidation = async () => {
  try {
    console.log('🧪 Testing Signup Validation...\n');
    
    // Test 1: Send OTP for login (without fullName)
    console.log('📱 Test 1: Sending OTP for login (no fullName)...');
    const sendResponse = await axios.post('http://localhost:5000/api/users/send-otp', {
      phoneNumber: '9999999999'
    });
    
    console.log('✅ OTP sent successfully');
    console.log('📱 Phone:', sendResponse.data.data.phoneNumber);
    
    // Test 2: Try to verify OTP without signup (login flow)
    console.log('\n🔍 Test 2: Verifying OTP without signup (login flow)...');
    try {
      const verifyResponse = await axios.post('http://localhost:5000/api/users/verify-otp', {
        phoneNumber: '9999999999',
        otp: '123456' // Using a dummy OTP to test the flow
      });
      console.log('❌ Unexpected success:', verifyResponse.data);
    } catch (error) {
      if (error.response && error.response.data.message.includes('Signup First')) {
        console.log('✅ SUCCESS: Got "Signup First" error as expected!');
        console.log('📝 Message:', error.response.data.message);
      } else {
        console.log('⚠️ Different error:', error.response?.data?.message || error.message);
      }
    }
    
    // Test 3: Verify OTP with signup (with fullName)
    console.log('\n📝 Test 3: Verifying OTP with signup (with fullName)...');
    try {
      const signupResponse = await axios.post('http://localhost:5000/api/users/verify-otp', {
        phoneNumber: '9999999999',
        otp: '123456', // Using a dummy OTP
        fullName: 'Test User'
      });
      console.log('⚠️ Unexpected success:', signupResponse.data);
    } catch (error) {
      console.log('📝 Expected OTP error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Signup validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testSignupValidation();
