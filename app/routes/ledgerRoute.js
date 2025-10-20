const express = require('express');
const router = express.Router();
const LedgerController = require('../controllers/ledgerController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// Apply authentication and multi-tenancy middleware to all routes
router.use(authenticate);
router.use(multiTenancy);

// Ledger transactions routes
router.get('/transactions', LedgerController.getLedgerTransactions);
router.get('/transactions/:id', LedgerController.getTransactionById);

// Summary routes
router.get('/summary', LedgerController.getLedgerSummary);
router.get('/customer-summary', LedgerController.getCustomerSummary);
router.get('/dashboard-summary', LedgerController.getDashboardSummary);

// Date ranges
router.get('/date-ranges', LedgerController.getPredefinedDateRanges);

// Snapshots routes
router.get('/snapshots', LedgerController.getSnapshots);
router.get('/snapshots/latest', LedgerController.getLatestSnapshot);
router.post('/snapshots', LedgerController.createDailySnapshot);

// Data management routes
router.post('/sync-data', LedgerController.syncExistingData);
router.post('/cdata-master', LedgerController.createMasterData);
router.post('/cdata-transactions', LedgerController.createMasterDataWithTransactions);
router.post('/cdata-comprehensive', LedgerController.createComprehensiveTestData);

// Export routes
router.get('/export', LedgerController.exportLedgerData);

module.exports = router;
