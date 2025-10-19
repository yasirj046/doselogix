const express = require('express');
const router = express.Router();
const salesProductController = require('../controllers/salesProductController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Get all sales products with pagination and filtering
router.get('/', multiTenancy, salesProductController.getAllSalesProducts);

// Get sales products by sales invoice
router.get('/invoice/:salesInvoiceId', multiTenancy, salesProductController.getSalesProductsBySalesInvoice);

// Get sales products by product
router.get('/product/:productId', multiTenancy, salesProductController.getSalesProductsByProduct);

// Get expiring sales products
router.get('/expiring', multiTenancy, salesProductController.getExpiringSalesProducts);

// Get product sales history
router.get('/history/:productId', multiTenancy, salesProductController.getProductSalesHistory);

// Get batch sales history
router.get('/batch/:productId/:batchNumber', multiTenancy, salesProductController.getBatchSalesHistory);

// Get sales products by batch number
router.get('/batch/:batchNumber', multiTenancy, salesProductController.getSalesProductsByBatch);

// Get available inventory for sale
router.get('/inventory/available', multiTenancy, salesProductController.getInventoryAvailableForSale);

// Get sales analytics
router.get('/analytics/summary', multiTenancy, salesProductController.getSalesAnalytics);

// Get a single sales product by ID
router.get('/:id', multiTenancy, salesProductController.getSalesProductById);

// Update a sales product
router.put('/:id', multiTenancy, salesProductController.updateSalesProduct);

// Toggle sales product active status
router.patch('/:id/toggle-status', multiTenancy, salesProductController.toggleSalesProductStatus);

// Delete a sales product
router.delete('/:id', multiTenancy, salesProductController.deleteSalesProduct);

module.exports = router;
