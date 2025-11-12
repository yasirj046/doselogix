const express = require('express');
const router = express.Router();
const deliveryLogController = require('../controllers/deliveryLogController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new delivery log
router.post('/', multiTenancy, deliveryLogController.createDeliveryLog);

// Get all delivery logs with pagination and filtering
router.get('/', multiTenancy, deliveryLogController.getAllDeliveryLogs);

// Get delivery logs by date range
router.get('/date-range', multiTenancy, deliveryLogController.getDeliveryLogsByDateRange);

// Get delivery log statistics
router.get('/stats', multiTenancy, deliveryLogController.getDeliveryLogStats);

// Preview delivery log number (before creating invoice)
router.get('/preview-number', multiTenancy, deliveryLogController.getDeliveryLogNumber);

// Get a single delivery log by ID
router.get('/:id', multiTenancy, deliveryLogController.getDeliveryLogById);

// Update a delivery log
router.put('/:id', multiTenancy, deliveryLogController.updateDeliveryLog);

// Toggle delivery log active status
router.patch('/:id/toggle-status', multiTenancy, deliveryLogController.toggleDeliveryLogStatus);

// Recalculate total for a delivery log
router.post('/:id/recalculate', multiTenancy, deliveryLogController.recalculateTotal);

// Sync all unadded invoices into delivery logs
router.post('/sync-missing-invoices', multiTenancy, deliveryLogController.syncMissingInvoices);

// Delete a delivery log
router.delete('/:id', multiTenancy, deliveryLogController.deleteDeliveryLog);

module.exports = router;
