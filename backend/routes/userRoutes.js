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
  getProcessingHistory
} = require('../controllers/userController');

// Public authentication routes (no auth required)
router.post('/register', register);
router.post('/login', login);

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