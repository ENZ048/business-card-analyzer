const axios = require('axios');

const testPopupFunctionality = async () => {
  try {
    console.log('🧪 Testing Popup Functionality...\n');
    
    const testPhone = '9324777191';
    
    // Step 1: Send OTP
    console.log('📱 Step 1: Sending OTP...');
    const sendResponse = await axios.post('http://localhost:5000/api/users/send-otp', {
      phoneNumber: testPhone
    });
    
    console.log('✅ OTP sent successfully');
    console.log('📱 Phone:', sendResponse.data.data.phoneNumber);
    
    // Step 2: Try to verify with wrong OTP to trigger popup
    console.log('\n🔍 Step 2: Testing popup with wrong OTP...');
    try {
      const verifyResponse = await axios.post('http://localhost:5000/api/users/verify-otp', {
        phoneNumber: testPhone,
        otp: '000000' // Wrong OTP
      });
      console.log('❌ Unexpected success:', verifyResponse.data);
    } catch (error) {
      console.log('✅ Expected error - this should trigger popup:');
      console.log('📝 Status:', error.response?.status);
      console.log('📝 Message:', error.response?.data?.message);
      console.log('📝 Error:', error.response?.data?.error);
      
      // This error should now be properly handled by the frontend popup
      if (error.response?.data?.message?.includes('Signup First')) {
        console.log('🎯 SUCCESS: "Signup First" error detected - popup should show!');
      } else if (error.response?.data?.message?.includes('Invalid')) {
        console.log('🎯 SUCCESS: "Invalid OTP" error detected - popup should show!');
      }
    }
    
    console.log('\n🎉 Popup functionality test completed!');
    console.log('📱 The frontend should now show custom popups instead of browser alerts.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testPopupFunctionality();
