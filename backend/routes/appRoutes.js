const express = require('express');
const router = express.Router();

// GET /api/app/version - Get current app version info
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0', // Update this when releasing a new version
    minVersion: '1.0.0', // Minimum supported version
    updateRequired: false, // Set to true if update is mandatory
    updateMessage: 'A new version of Super Scanner is available with improved features and bug fixes.',
    downloadUrl: 'https://play.google.com/store/apps/details?id=com.troikatech.superscanner', // Play Store link or direct download
    releaseNotes: [
      'Bug fixes and performance improvements',
      'Enhanced WhatsApp OTP authentication',
      'Improved user interface'
    ]
  });
});

module.exports = router;
