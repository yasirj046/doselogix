const express = require('express');
const router = express.Router();
const customerReportController = require('../controllers/customerReportController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);


/**
 * GET /api/reports/customers
 * Get summary report for all customers
 * Query params: startDate, endDate, paymentStatus, customerId (optional)
 */
router.get('/', multiTenancy, customerReportController.getCustomersReportSummary);


/**
 * GET /api/reports/customers/:customerId
 * Get detailed report for a specific customer
 * Query params: startDate, endDate, paymentStatus, keyword (optional)
 */
router.get('/:customerId', multiTenancy, customerReportController.getCustomerReport);

module.exports = router;
