const express = require('express');
const router = express.Router();
const purchaseProductController = require('../controllers/purchaseProductController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new purchase product
router.post('/', multiTenancy, purchaseProductController.createPurchaseProduct);

// Get all purchase products with pagination and filtering
router.get('/', multiTenancy, purchaseProductController.getAllPurchaseProducts);

// Get purchase products by purchase entry
router.get('/entry/:purchaseEntryId', multiTenancy, purchaseProductController.getPurchaseProductsByEntry);

// Get purchase products by product
router.get('/product/:productId', multiTenancy, purchaseProductController.getPurchaseProductsByProduct);

// Get expiring purchase products
router.get('/expiring', multiTenancy, purchaseProductController.getExpiringPurchaseProducts);

// Get product purchase history
router.get('/history/:productId', multiTenancy, purchaseProductController.getProductPurchaseHistory);

// Get batch details
router.get('/batch/:productId/:batchNumber', multiTenancy, purchaseProductController.getBatchDetails);

// Get a single purchase product by ID
router.get('/:id', multiTenancy, purchaseProductController.getPurchaseProductById);

// Update a purchase product
router.put('/:id', multiTenancy, purchaseProductController.updatePurchaseProduct);

// Toggle purchase product active status
router.patch('/:id/toggle-status', multiTenancy, purchaseProductController.togglePurchaseProductStatus);

// Delete a purchase product
router.delete('/:id', multiTenancy, purchaseProductController.deletePurchaseProduct);

module.exports = router;
