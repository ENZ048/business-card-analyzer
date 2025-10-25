const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getUserUsage,
  changePassword,
  getUserProfile,
  updateUserProfile,
  getProcessingHistory,
  sendOTP,
  verifyOTP
} = require('../controllers/userController');

// Public authentication routes (no auth required)
router.post('/register', register);
router.post('/login', login);

// WhatsApp OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes (require authentication)
router.use(authMiddleware);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Usage analytics routes
router.get('/usage', getUserUsage);
router.get('/history', getProcessingHistory);

// Password management routes
router.put('/change-password', changePassword);

module.exports = router;