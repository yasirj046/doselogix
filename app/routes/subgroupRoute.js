const express = require('express');
const router = express.Router();
const subgroupController = require('../controllers/subgroupController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Subgroup CRUD operations
router.post('/', subgroupController.createSubgroup);
router.get('/', subgroupController.getAllSubgroups);
router.get('/search', subgroupController.searchSubgroups);
router.get('/deleted', subgroupController.getDeletedSubgroups);
router.get('/group/:groupId', subgroupController.getSubgroupsByGroup);
router.get('/:id', subgroupController.getSubgroupById);
router.put('/:id', subgroupController.updateSubgroup);
router.delete('/:id', subgroupController.deleteSubgroup);
router.patch('/:id/restore', subgroupController.restoreSubgroup);

module.exports = router;
