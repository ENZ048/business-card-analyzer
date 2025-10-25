const axios = require('axios');

class WhatsAppOTPService {
  constructor() {
    this.apiUrl = process.env.AISENSY_API_URL || 'https://backend.api-wa.co/campaign/troika-tech-services/api/v2';
    this.apiKey = process.env.AISENSY_API_KEY;
    this.campaignName = process.env.AISENSY_CAMPAIGN_NAME || 'Signup OTP Campaign';
    this.templateName = process.env.AISENSY_TEMPLATE_NAME || 'otp_message';
  }

  // Send OTP via WhatsApp using AISensy API
  async sendOTP(phoneNumber, fullName = null, otpToSend = null) {
    try {
      // Format phone number (remove + and ensure it starts with country code)
      let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone; // Add India country code if not present
      }

      // Use provided OTP or generate new one
      const otp = otpToSend || this.generateOTP();

      // Prepare the request payload for AISensy (based on your reference)
      const payload = {
        apiKey: this.apiKey,
        campaignName: this.campaignName,
        destination: formattedPhone, // without + sign
        userName: "Troika Tech Services",
        templateParams: [otp],
        source: "Super Scanner",
        media: {},
        buttons: [
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
        carouselCards: [],
        location: {},
        attributes: {},
      };

      // Send request to AISensy API
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('WhatsApp OTP sent successfully:', {
        phoneNumber: formattedPhone,
        otp: otp,
        response: response.data
      });

      return {
        success: true,
        otp: otp,
        phoneNumber: formattedPhone,
        messageId: response.data?.messageId || null
      };

    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send OTP',
        details: error.response?.data || error.message
      };
    }
  }

  // Generate a 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Verify OTP (simple comparison for now)
  verifyOTP(storedOTP, providedOTP) {
    return storedOTP === providedOTP;
  }

  // Check if OTP is expired (5 minutes validity)
  isOTPExpired(otpTimestamp) {
    const now = new Date();
    const otpTime = new Date(otpTimestamp);
    const diffInMinutes = (now - otpTime) / (1000 * 60);
    return diffInMinutes > 5; // OTP expires after 5 minutes
  }
}

module.exports = new WhatsAppOTPService();
