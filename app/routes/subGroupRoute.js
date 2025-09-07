const express = require('express');
const router = express.Router();
const subGroupController = require('../controllers/subGroupController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new sub group
router.post('/', multiTenancy, subGroupController.createSubGroup);

// Get all sub groups with pagination and filtering
router.get('/', multiTenancy, subGroupController.getAllSubGroups);

// Get my sub groups (vendor-specific)
router.get('/my/subgroups', multiTenancy, subGroupController.getMySubGroups);

// Get sub groups by group
router.get('/group/:groupId', multiTenancy, subGroupController.getSubGroupsByGroup);

// Get sub groups by name pattern
router.get('/search/:subGroupName', multiTenancy, subGroupController.getSubGroupsByName);

// Get a single sub group by ID
router.get('/:id', multiTenancy, subGroupController.getSubGroupById);

// Update a sub group
router.put('/:id', multiTenancy, subGroupController.updateSubGroup);

// Toggle sub group status
router.patch('/:id/toggle-status', multiTenancy, subGroupController.toggleSubGroupStatus);

// Delete a sub group
router.delete('/:id', multiTenancy, subGroupController.deleteSubGroup);

module.exports = router;
