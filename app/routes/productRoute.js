const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new product
router.post('/', multiTenancy, productController.createProduct);

// Get all products with pagination and filtering
router.get('/', multiTenancy, productController.getAllProducts);

// Get my products (vendor-specific)
router.get('/my/products', multiTenancy, productController.getMyProducts);

// Get product statistics
router.get('/stats', multiTenancy, productController.getProductStats);

// Get products by brand
router.get('/brand/:brandId', multiTenancy, productController.getProductsByBrand);

// Get products by group
router.get('/group/:groupId', multiTenancy, productController.getProductsByGroup);

// Get products by subgroup
router.get('/subgroup/:subGroupId', multiTenancy, productController.getProductsBySubGroup);

// Get a single product by ID
router.get('/:id', multiTenancy, productController.getProductById);

// Update a product
router.put('/:id', multiTenancy, productController.updateProduct);

// Toggle product active status
router.patch('/:id/toggle-status', multiTenancy, productController.toggleProductStatus);

// Delete a product
router.delete('/:id', multiTenancy, productController.deleteProduct);

module.exports = router;
