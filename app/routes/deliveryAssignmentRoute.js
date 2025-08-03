const express = require("express");
const router = express.Router();
const deliveryAssignmentController = require("../controllers/deliveryAssignmentController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all delivery assignments with pagination and filters
router.get("/", deliveryAssignmentController.getAllDeliveryAssignments);

// Get delivery assignment by ID (shows all invoices for that deliveryman on that date)
router.get("/:id", deliveryAssignmentController.getDeliveryAssignmentById);

// Get delivery assignments by deliveryman
router.get("/deliveryman/:deliverymanId", deliveryAssignmentController.getDeliveryAssignmentsByDeliveryman);

// Get delivery assignments by date range
router.get("/date-range/:startDate/:endDate", deliveryAssignmentController.getDeliveryAssignmentsByDateRange);

// Get delivery assignment statistics
router.get("/stats/summary", deliveryAssignmentController.getDeliveryAssignmentStats);

// Get delivery assignment summary report
router.get("/reports/summary", deliveryAssignmentController.getDeliveryAssignmentSummary);

// Manual sync for existing invoices (optional utility)
router.post("/sync/existing-invoices", deliveryAssignmentController.syncExistingInvoices);

// Remove invoice from delivery assignment (if invoice is cancelled/deleted)
router.delete("/invoice/:invoiceId", deliveryAssignmentController.removeInvoiceFromAssignment);

module.exports = router;
