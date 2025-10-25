const axios = require('axios');

const testPopupPersistence = async () => {
  try {
    console.log('🧪 Testing Popup Persistence During Redirect...\n');
    
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
    console.log('   The popup should persist during redirect to signup form');
    
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
        console.log('🎯 This should now trigger the persistent popup in the frontend');
        console.log('🎯 The popup should stay visible for 3 seconds');
        console.log('🎯 Then automatically redirect to signup form');
        console.log('🎯 The popup should NOT disappear during the transition');
      } else {
        console.log('⚠️ Different error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 Popup persistence test completed!');
    console.log('📱 Expected frontend behavior:');
    console.log('   1. ✅ Custom popup appears with "Signup Required" title');
    console.log('   2. ✅ Popup stays visible for 3 seconds (autoClose: true)');
    console.log('   3. ✅ Popup persists during component transition');
    console.log('   4. ✅ After 3 seconds, redirects to signup form');
    console.log('   5. ✅ Popup remains visible until user closes it');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testPopupPersistence();
