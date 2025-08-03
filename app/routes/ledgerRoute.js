const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/ledgerController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard and summary routes
router.get("/summary", ledgerController.getFinancialSummary);

// Payables routes
router.get("/payables", ledgerController.getPayables);
router.post("/payables", ledgerController.createPayable);

// Receivables routes
router.get("/receivables", ledgerController.getReceivables);
router.post("/receivables", ledgerController.createReceivable);

// Expenses routes
router.get("/expenses", ledgerController.getExpenses);
router.post("/expenses", ledgerController.createExpense);

// General ledger entry management
router.put("/:id", ledgerController.updateLedgerEntry);
router.delete("/:id", ledgerController.deleteLedgerEntry);

module.exports = router;
