const express = require('express');
const router = express.Router();
const subAreaController = require('../controllers/subAreaController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new sub area
router.post('/', multiTenancy, subAreaController.createSubArea);

// Get all sub areas with pagination and filtering
router.get('/', multiTenancy, subAreaController.getAllSubAreas);

// Get my sub areas (vendor-specific)
router.get('/my/subareas', multiTenancy, subAreaController.getMySubAreas);

// Get sub areas by vendor with optional filters
router.get('/vendor/subareas', multiTenancy, subAreaController.getSubAreasByVendor);

// Get sub areas by area ID
router.get('/area/:areaId', multiTenancy, subAreaController.getSubAreasByArea);

// Get sub areas by name pattern
router.get('/search/:subAreaName', multiTenancy, subAreaController.getSubAreasByName);

// Get a single sub area by ID
router.get('/:id', multiTenancy, subAreaController.getSubAreaById);

// Update a sub area
router.put('/:id', multiTenancy, subAreaController.updateSubArea);

// Toggle sub area status
router.patch('/:id/toggle-status', multiTenancy, subAreaController.toggleSubAreaStatus);

// Delete a sub area
router.delete('/:id', multiTenancy, subAreaController.deleteSubArea);

module.exports = router;
