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

// Get a single group by ID
router.get('/:id', multiTenancy, groupController.getGroupById);

// Update a group
router.put('/:id', multiTenancy, groupController.updateGroup);

// Toggle group status
router.patch('/:id/toggle-status', multiTenancy, groupController.toggleGroupStatus);

// Delete a group
router.delete('/:id', multiTenancy, groupController.deleteGroup);

module.exports = router;
