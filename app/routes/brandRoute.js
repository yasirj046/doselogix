const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes (constants)
router.get("/constants", brandController.getConstants);
router.get("/constants/cities/:province", brandController.getCitiesByProvince);

// Protected routes
router.post("/", authenticate, brandController.createBrand);
router.get("/", authenticate, brandController.getAllBrands);
router.get("/province/:province", authenticate, brandController.getBrandsByProvince);
router.get("/city/:city", authenticate, brandController.getBrandsByCity);
router.get("/brand-id/:brandId", authenticate, brandController.getBrandByBrandId);
router.get("/:id", authenticate, brandController.getBrandById);
router.put("/:id", authenticate, brandController.updateBrand);
router.delete("/:id", authenticate, brandController.deleteBrand);

module.exports = router;
