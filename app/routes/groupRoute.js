const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new group
router.post('/', multiTenancy, groupController.createGroup);

// Get all groups with pagination and filtering
router.get('/', multiTenancy, groupController.getAllGroups);

// Get my groups (vendor-specific)
router.get('/my/groups', multiTenancy, groupController.getMyGroups);

// Get groups by vendor with optional filters
router.get('/vendor/groups', multiTenancy, groupController.getGroupsByVendor);

// Get groups by brand
router.get('/brand/:brandId', multiTenancy, groupController.getGroupsByBrand);

// Get unique groups by brand (for dependent filtering)
router.get('/unique/brand/:brandId', multiTenancy, groupController.getUniqueGroupsByBrand);

// Get all unique groups (with optional brand filter)
router.get('/unique/all', multiTenancy, groupController.getAllUniqueGroups);

// Get sub groups by group (dependent filter)
router.get('/subgroups', multiTenancy, groupController.getSubGroupsByGroup);

// Get groups by name pattern
router.get('/search/:group', multiTenancy, groupController.getGroupsByName);

// Get a single group by ID
router.get('/:id', multiTenancy, groupController.getGroupById);

// Update a group
router.put('/:id', multiTenancy, groupController.updateGroup);

// Toggle group status
router.patch('/:id/toggle-status', multiTenancy, groupController.toggleGroupStatus);

// Delete a group
router.delete('/:id', multiTenancy, groupController.deleteGroup);

module.exports = router;
