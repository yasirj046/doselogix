const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new area
router.post('/', multiTenancy, areaController.createArea);

// Get all areas with pagination and filtering
router.get('/', multiTenancy, areaController.getAllAreas);

// Get my areas (vendor-specific)
router.get('/my/areas', multiTenancy, areaController.getMyAreas);

// Get areas by vendor with optional filters
router.get('/vendor/areas', multiTenancy, areaController.getAreasByVendor);

// Get areas by name pattern
router.get('/search/:area', multiTenancy, areaController.getAreasByName);

// Get a single area by ID
router.get('/:id', multiTenancy, areaController.getAreaById);

// Update an area
router.put('/:id', multiTenancy, areaController.updateArea);

// Toggle area status
router.patch('/:id/toggle-status', multiTenancy, areaController.toggleAreaStatus);

// Delete an area
router.delete('/:id', multiTenancy, areaController.deleteArea);

module.exports = router;
