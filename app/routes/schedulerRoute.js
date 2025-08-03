const express = require("express");
const router = express.Router();
const schedulerController = require("../controllers/schedulerController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get scheduler status
router.get("/status", schedulerController.getSchedulerStatus);

// Manual trigger endpoints
router.post("/trigger/low-stock", schedulerController.triggerLowStockCheck);
router.post("/trigger/expiry", schedulerController.triggerExpiryCheck);
router.post("/trigger/payment-reminder", schedulerController.triggerPaymentReminderCheck);
router.post("/trigger/license-expiry", schedulerController.triggerLicenseExpiryCheck);
router.post("/trigger/all", schedulerController.triggerAllChecks);

module.exports = router;
