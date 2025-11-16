const express = require("express");
const router = express.Router();
const lookupController = require("../controllers/lookupController");
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// Get all provinces
router.get("/provinces", lookupController.getAllProvinces);

// Get cities by province
router.get("/cities", lookupController.getCitiesByProvince);

// Get all customer categories
router.get("/categories", lookupController.getCustomerCategories);

// Get all designations
router.get("/designations", lookupController.getDesignations);

// Get all cities
router.get("/all-cities", lookupController.getAllCities);

// Area lookups (require authentication)
router.get("/areas", authenticate, multiTenancy, lookupController.getAreasByVendor);
router.get("/areas-by-customers-sales", authenticate, multiTenancy, lookupController.getAreasByCustomersWithSales);
router.get("/subareas", authenticate, multiTenancy, lookupController.getSubAreasByArea);
router.get("/subareas-by-customers-sales", authenticate, multiTenancy, lookupController.getSubAreasByCustomersWithSales);

// Product-related lookups (require authentication)
router.get("/brands", authenticate, multiTenancy, lookupController.getBrandsByVendor);
router.get("/groups", authenticate, multiTenancy, lookupController.getGroupsByVendor);
router.get("/groups-by-brand", authenticate, multiTenancy, lookupController.getGroupsByBrand);
router.get("/unique-groups", authenticate, multiTenancy, lookupController.getUniqueGroupNames);
router.get("/subgroups", authenticate, multiTenancy, lookupController.getSubGroupsByVendor);
router.get("/subgroups-by-group", authenticate, multiTenancy, lookupController.getSubGroupsByGroup);
router.get("/products", authenticate, multiTenancy, lookupController.getProductsByFilters);

// Customer and Employee lookups (require authentication)
router.get("/customers", authenticate, multiTenancy, lookupController.getCustomersByVendor);
router.get("/employees", authenticate, multiTenancy, lookupController.getEmployeesByVendor);

// Expense categories lookup (no authentication required)
router.get("/expense-categories", lookupController.getExpenseCategories);

module.exports = router; 