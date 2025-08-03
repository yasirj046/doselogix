const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', companyController.register);
router.post('/verify', companyController.verifyRegistration);
router.post('/resend-otp', companyController.resendOtp);

// Protected routes (require authentication)
router.use(authenticate); // Apply authentication middleware to all routes below

// Company profile routes
router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);
router.get('/statistics', companyController.getStatistics);

module.exports = router;
