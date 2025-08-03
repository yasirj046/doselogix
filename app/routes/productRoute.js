const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Product CRUD operations
router.post('/', productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/deleted', productController.getDeletedProducts);
router.get('/product-id/:productId', productController.getProductByProductId);
router.get('/brand/:brandId', productController.getProductsByBrand);
router.get('/group/:groupId', productController.getProductsByGroup);
router.get('/subgroup/:subgroupId', productController.getProductsBySubgroup);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/restore', productController.restoreProduct);

module.exports = router;
