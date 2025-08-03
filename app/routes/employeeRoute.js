const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Employee CRUD operations
router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/search', employeeController.searchEmployees);
router.get('/deleted', employeeController.getDeletedEmployees);
router.get('/employee-id/:employeeId', employeeController.getEmployeeByEmployeeId);
router.get('/province/:province', employeeController.getEmployeesByProvince);
router.get('/city/:city', employeeController.getEmployeesByCity);
router.get('/designation/:designation', employeeController.getEmployeesByDesignation);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);
router.patch('/:id/restore', employeeController.restoreEmployee);

module.exports = router;
