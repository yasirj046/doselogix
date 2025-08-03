const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Invoice CRUD routes
router.post("/", invoiceController.createInvoice);
router.get("/", invoiceController.getAllInvoices);
router.get("/stats", invoiceController.getInvoiceStats);
router.get("/:id", invoiceController.getInvoiceById);
router.put("/:id/payment", invoiceController.updateInvoicePayment);
router.delete("/:id", invoiceController.deleteInvoice);

module.exports = router;
