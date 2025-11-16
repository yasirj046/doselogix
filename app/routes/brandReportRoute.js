const express = require('express');
const router = express.Router();
const brandReportController = require('../controllers/brandReportController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);


/**
 * GET /api/reports/brands
 * Get summary report for all brands
 * Query params: startDate, endDate (optional)
 */
router.get('/', multiTenancy, brandReportController.getBrandsReportSummary);


/**
 * GET /api/reports/brands/:brandId
 * Get detailed report for a specific brand
 * Query params: startDate, endDate (optional)
 */
router.get('/:brandId', multiTenancy, brandReportController.getBrandReport);

module.exports = router;
