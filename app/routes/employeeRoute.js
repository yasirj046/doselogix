const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { authenticate } = require("../middleware/authMiddleware");
const { multiTenancy } = require("../middleware/multiTenancyMiddleware");

// All routes require authentication
router.use(authenticate);

// Routes that need multi-tenancy (vendor data isolation)
router.get("/", multiTenancy, employeeController.getAllEmployees);
router.post("/", multiTenancy, employeeController.createEmployee);

// Routes that don't need multi-tenancy (already have vendorId in params or body)
router.get("/:id", multiTenancy, employeeController.getEmployeeById);
router.put("/:id", multiTenancy, employeeController.updateEmployee);
router.delete("/:id", multiTenancy, employeeController.deleteEmployee);

// Vendor-specific employee operations
router.get("/vendor/:vendorId", employeeController.getEmployeesByVendor);


// Specific employee operations

// router.get("/active", multiTenancy, employeeController.getActiveEmployees);
router.get("/designation/:designation", multiTenancy, employeeController.getEmployeesByDesignation);

// Status management
router.patch("/:id/toggle-status", multiTenancy, employeeController.toggleEmployeeStatus);

module.exports = router;
