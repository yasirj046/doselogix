const express = require('express');
const router = express.Router();
const subAreaController = require('../controllers/subAreaController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// SubArea CRUD operations
router.post('/', subAreaController.createSubArea);
router.get('/', subAreaController.getAllSubAreas);
router.get('/search', subAreaController.searchSubAreas);
router.get('/area/:areaId', subAreaController.getSubAreasByArea);
router.get('/:id', subAreaController.getSubAreaById);
router.put('/:id', subAreaController.updateSubArea);
router.delete('/:id', subAreaController.deleteSubArea);

module.exports = router;
