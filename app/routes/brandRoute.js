const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy, ensureVendorOwnership } = require('../middleware/multiTenancyMiddleware');

// Apply authentication to all routes
router.use(authenticate);

// Create a new brand
router.post('/', multiTenancy, brandController.createBrand);

// Get all brands with pagination
router.get('/', multiTenancy, brandController.getAllBrands);

// Get a single brand by ID
router.get('/:id', multiTenancy, brandController.getBrandById);

// Update a brand
router.put('/:id', multiTenancy, brandController.updateBrand);

// Toggle brand active status
router.patch('/:id/toggle-status', multiTenancy, brandController.toggleBrandStatus);

module.exports = router; 