const express = require("express");
const router = express.Router();
const userCustomersController = require("../controllers/userCustomersController");
const { authenticate } = require("../middleware/authMiddleware");
const { multiTenancy } = require("../middleware/multiTenancyMiddleware");

// All routes require authentication
router.use(authenticate);

// Routes that need multi-tenancy (vendor data isolation)
router.get("/", multiTenancy, userCustomersController.getAllCustomers);
router.post("/", multiTenancy, userCustomersController.createCustomer);

// Routes that don't need multi-tenancy (already have vendorId in params or body)
router.get("/:id", userCustomersController.getCustomerById);
router.put("/:id", multiTenancy, userCustomersController.updateCustomer);
router.delete("/:id", userCustomersController.deleteCustomer);

// Vendor-specific customer operations
router.get("/vendor/:vendorId", userCustomersController.getCustomersByVendor);
router.get("/my/customers", multiTenancy, userCustomersController.getMyCustomers);

// License management
router.get("/expiring/license", multiTenancy, userCustomersController.getCustomersWithExpiringLicense);

// Category-based filtering
router.get("/vendor/:vendorId/category/:customerCategory", userCustomersController.getCustomersByCategory);

// Location-based filtering
router.get("/vendor/:vendorId/location/:customerProvince", userCustomersController.getCustomersByLocation);

// Status management
router.patch("/:id/toggle-status", multiTenancy, userCustomersController.toggleCustomerStatus);

module.exports = router; 