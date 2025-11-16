const express = require('express')
const router = express.Router()
const productReportController = require('../controllers/productReportController')
const { authenticate } = require('../middleware/authMiddleware')
const { multiTenancy } = require('../middleware/multiTenancyMiddleware')

// Apply authentication middleware to all routes
router.use(authenticate)

// Get product report summary
router.get('/', multiTenancy, productReportController.getProductReport)

// Get detailed product report
router.get('/:productId/:customerId', multiTenancy, productReportController.getProductDetailedReport)

module.exports = router
