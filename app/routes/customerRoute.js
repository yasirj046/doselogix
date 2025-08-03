const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Customer CRUD operations
router.post('/', customerController.createCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/deleted', customerController.getDeletedCustomers);
router.get('/expiring-licenses', customerController.getCustomersWithExpiringLicenses);
router.get('/customer-id/:customerId', customerController.getCustomerByCustomerId);
router.get('/province/:province', customerController.getCustomersByProvince);
router.get('/city/:city', customerController.getCustomersByCity);
router.get('/category/:category', customerController.getCustomersByCategory);
router.get('/area/:areaId', customerController.getCustomersByArea);
router.get('/subarea/:subAreaId', customerController.getCustomersBySubArea);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.patch('/:id/restore', customerController.restoreCustomer);

module.exports = router;
