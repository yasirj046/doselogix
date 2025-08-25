const express = require("express");
const router = express.Router();
const lookupController = require("../controllers/lookupController");

// Get all provinces
router.get("/provinces", lookupController.getAllProvinces);

// Get cities by province
router.get("/cities", lookupController.getCitiesByProvince);

// Get all customer categories
router.get("/categories", lookupController.getCustomerCategories);

module.exports = router; 