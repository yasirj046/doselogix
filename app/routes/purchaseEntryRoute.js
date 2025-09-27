const express = require('express');
const router = express.Router();
const purchaseEntryController = require('../controllers/purchaseEntryController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new purchase entry
router.post('/', multiTenancy, purchaseEntryController.createPurchaseEntry);

// Get all purchase entries with pagination and filtering
router.get('/', multiTenancy, purchaseEntryController.getAllPurchaseEntries);

// Get purchase entries by date range
router.get('/date-range', multiTenancy, purchaseEntryController.getPurchaseEntriesByDateRange);

// Get purchase statistics
router.get('/stats', multiTenancy, purchaseEntryController.getPurchaseStats);

// Get last invoice data by brand
router.get('/last-invoice/:brandId', multiTenancy, purchaseEntryController.getLastInvoiceByBrand);

// Get a single purchase entry by ID
router.get('/:id', multiTenancy, purchaseEntryController.getPurchaseEntryById);

// Update a purchase entry
router.put('/:id', multiTenancy, purchaseEntryController.updatePurchaseEntry);

// Toggle purchase entry active status
router.patch('/:id/toggle-status', multiTenancy, purchaseEntryController.togglePurchaseEntryStatus);

// Add payment to credit
router.post('/:id/add-payment', multiTenancy, purchaseEntryController.addPaymentToCredit);

// Remove payment from credit
router.delete('/:id/remove-payment/:paymentIndex', multiTenancy, purchaseEntryController.removePaymentFromCredit);

// Delete a purchase entry
router.delete('/:id', multiTenancy, purchaseEntryController.deletePurchaseEntry);

module.exports = router;
