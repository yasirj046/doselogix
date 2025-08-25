const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy, ensureVendorOwnership } = require('../middleware/multiTenancyMiddleware');

// Create a new brand
router.post('/', authenticate, multiTenancy, brandController.createBrand);

// Get all brands with pagination
router.get('/', authenticate, multiTenancy, brandController.getAllBrands);

// Get a single brand by ID
router.get('/:id', authenticate, multiTenancy, brandController.getBrandById);

// Update a brand
router.put('/:id', authenticate, multiTenancy, brandController.updateBrand);

// Toggle brand active status
router.patch('/:id/toggle-status', authenticate, multiTenancy, brandController.toggleBrandStatus);

module.exports = router; 