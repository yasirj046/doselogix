const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Group CRUD operations
router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.get('/search', groupController.searchGroups);
router.get('/deleted', groupController.getDeletedGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.patch('/:id/restore', groupController.restoreGroup);

module.exports = router;
