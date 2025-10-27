// Test script to check if OTP is sent for unregistered users
const axios = require('axios');

async function testSendOTP() {
  try {
    // Test with an unregistered phone number
    const response = await axios.post('http://localhost:5000/api/users/send-otp', {
      phoneNumber: '8424868079' // Unregistered number
    });
    
    console.log('❌ FAILED: OTP was sent when it should not have been');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response?.data?.message === 'Signup First for login') {
      console.log('✅ PASSED: User existence check working correctly!');
      console.log('Response:', error.response.data);
    } else {
      console.log('❌ FAILED: Unexpected error');
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

testSendOTP();

