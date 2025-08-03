const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes (for company/system info display)
router.get("/company", (req, res) => res.json({ test: "company route works" }));
router.get("/system", (req, res) => res.json({ test: "system route works" }));
router.get("/id-generation", (req, res) => res.json({ test: "id-generation route works" }));

// Apply authentication middleware to protected routes
router.use(authenticate);

// Admin-only settings management
// TODO: Fix settingsController syntax errors
// router.get("/", settingsController.getSettings);
// router.get("/category/:category", settingsController.getSettingsCategory);
// router.put("/category/:category", settingsController.updateSettingsCategory);
// router.get("/financial", settingsController.getFinancialSettings);

// System management
// router.post("/initialize", settingsController.initializeSettings);
// router.post("/test-email", settingsController.testEmailConfiguration);

// Legacy routes for backward compatibility
// router.put("/", settingsController.updateSettings);

module.exports = router;
