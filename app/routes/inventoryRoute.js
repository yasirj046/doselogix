const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const inventoryPaymentController = require("../controllers/inventoryPaymentController");
const { authenticate } = require("../middleware/authMiddleware");

// Create new inventory entry
router.post("/", authenticate, inventoryController.createInventory);

// Get all inventories with pagination, filtering, and search
router.get("/", authenticate, inventoryController.getAllInventories);

// Get inventory statistics
router.get("/stats", authenticate, inventoryController.getInventoryStats);

// Get inventory by ID
router.get("/:id", authenticate, inventoryController.getInventoryById);

// Update inventory
router.put("/:id", authenticate, inventoryController.updateInventory);

// Delete inventory (soft delete)
router.delete("/:id", authenticate, inventoryController.deleteInventory);

// Update inventory payment (PIS approach)
router.put("/:id/payment", authenticate, inventoryController.updateInventoryPayment);

// Legacy PIS Routes (for backward compatibility)
// Create inventory with payment in one transaction
router.post("/with-payment", authenticate, inventoryPaymentController.createInventoryWithPayment);

// Get inventory with payment details
router.get("/:id/with-payment", authenticate, inventoryPaymentController.getInventoryWithPayment);

// Update payment information for existing inventory (legacy)
router.put("/:id/payment-legacy", authenticate, inventoryPaymentController.updateInventoryPayment);

module.exports = router;
