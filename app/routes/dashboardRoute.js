const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const predictionController = require('../controllers/predictionController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Dashboard Routes
 * All routes return JSON data ready for visualization
 * Support date range filtering via query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * All routes use multiTenancy for vendor data isolation
 */

// GET /api/dashboard/summary-cards - Get summary statistics
router.get('/summary-cards', multiTenancy, dashboardController.getSummaryCards);

// GET /api/dashboard/brand-wise-sales - Get brand performance data
router.get('/brand-wise-sales', multiTenancy, dashboardController.getBrandWiseSales);

// GET /api/dashboard/top-products - Get top selling products
router.get('/top-products', multiTenancy, dashboardController.getTopSellingProducts);

// GET /api/dashboard/receivables-aging - Get customer receivables by age
router.get('/receivables-aging', multiTenancy, dashboardController.getReceivablesAging);

// GET /api/dashboard/stock-alerts - Get low stock alerts
router.get('/stock-alerts', multiTenancy, dashboardController.getStockAlerts);

// GET /api/dashboard/near-expiry - Get products near expiry
router.get('/near-expiry', multiTenancy, dashboardController.getNearExpiryProducts);

// GET /api/dashboard/area-wise-sales - Get sales by area
router.get('/area-wise-sales', multiTenancy, dashboardController.getAreaWiseSales);

// GET /api/dashboard/invoice-breakdown - Get cash vs credit breakdown
router.get('/invoice-breakdown', multiTenancy, dashboardController.getInvoiceBreakdown);

// GET /api/dashboard/complete - Get all dashboard data in one call (optimized for initial load)
router.get('/complete', multiTenancy, dashboardController.getCompleteDashboard);

// GET /api/dashboard/sales-prediction - Get ML-based sales prediction for a product
router.get('/sales-prediction', multiTenancy, predictionController.getProductSalesPrediction);

// GET /api/dashboard/products-with-sales - Get list of products with sales history
router.get('/products-with-sales', multiTenancy, predictionController.getProductsWithSalesHistory);

module.exports = router;
