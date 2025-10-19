const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoiceController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new sales invoice
router.post('/', multiTenancy, salesInvoiceController.createSalesInvoice);

// Get all sales invoices with pagination and filtering
router.get('/', multiTenancy, salesInvoiceController.getAllSalesInvoices);

// Get sales invoices by date range
router.get('/date-range', multiTenancy, salesInvoiceController.getSalesInvoicesByDateRange);

// Get sales statistics
router.get('/stats', multiTenancy, salesInvoiceController.getSalesStats);

// Get last invoice data by customer
router.get('/last-invoice/:customerId', multiTenancy, salesInvoiceController.getLastInvoiceByCustomer);

// Get available inventory for sales (FIFO sorted)
router.get('/inventory/:productId', multiTenancy, salesInvoiceController.getAvailableInventory);

// Get last three prices for customer-product combination
router.get('/price-history', multiTenancy, salesInvoiceController.getLastThreePricesForCustomer);

// Get sales invoices by customer
router.get('/customer/:customerId', multiTenancy, salesInvoiceController.getSalesInvoicesByCustomer);

// Get sales invoices by employee
router.get('/employee/:employeeId', multiTenancy, salesInvoiceController.getSalesInvoicesByEmployee);

// Get a single sales invoice by ID
router.get('/:id', multiTenancy, salesInvoiceController.getSalesInvoiceById);

// Update a sales invoice
router.put('/:id', multiTenancy, salesInvoiceController.updateSalesInvoice);

// Toggle sales invoice active status
router.patch('/:id/toggle-status', multiTenancy, salesInvoiceController.toggleSalesInvoiceStatus);

// Add payment to credit
router.post('/:id/add-payment', multiTenancy, salesInvoiceController.addPaymentToCredit);

// Remove payment from credit
router.delete('/:id/remove-payment/:paymentIndex', multiTenancy, salesInvoiceController.removePaymentFromCredit);

// Delete a sales invoice
router.delete('/:id', multiTenancy, salesInvoiceController.deleteSalesInvoice);

module.exports = router;
