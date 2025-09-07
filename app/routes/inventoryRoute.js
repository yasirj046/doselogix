const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new inventory item
router.post('/', multiTenancy, inventoryController.createInventory);

// Get all inventory with pagination and filtering
router.get('/', multiTenancy, inventoryController.getAllInventory);

// Get inventory by product
router.get('/product/:productId', multiTenancy, inventoryController.getInventoryByProduct);

// Get low stock items
router.get('/low-stock', multiTenancy, inventoryController.getLowStockItems);

// Get out of stock items
router.get('/out-of-stock', multiTenancy, inventoryController.getOutOfStockItems);

// Get expiring products
router.get('/expiring', multiTenancy, inventoryController.getExpiringProducts);

// Get expired products
router.get('/expired', multiTenancy, inventoryController.getExpiredProducts);

// Get inventory summary
router.get('/summary', multiTenancy, inventoryController.getInventorySummary);

// Get inventory value
router.get('/value', multiTenancy, inventoryController.getInventoryValue);

// Reserve stock
router.post('/reserve', multiTenancy, inventoryController.reserveStock);

// Release reserved stock
router.post('/release', multiTenancy, inventoryController.releaseReservedStock);

// Update stock
router.post('/update-stock', multiTenancy, inventoryController.updateStock);

// Get a single inventory item by ID
router.get('/:id', multiTenancy, inventoryController.getInventoryById);

// Update an inventory item
router.put('/:id', multiTenancy, inventoryController.updateInventory);

// Adjust inventory
router.patch('/:id/adjust', multiTenancy, inventoryController.adjustInventory);

// Toggle inventory item active status
router.patch('/:id/toggle-status', multiTenancy, inventoryController.toggleInventoryStatus);

// Delete an inventory item
router.delete('/:id', multiTenancy, inventoryController.deleteInventory);

module.exports = router;
