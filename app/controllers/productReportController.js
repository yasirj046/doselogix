const productReportService = require('../services/productReportService')
const { createResponse } = require('../util/util')
const util = require('util')

/**
 * Get product report (summary view)
 * GET /api/reports/products
 */
exports.getProductReport = async (req, res) => {
  try {
    const {
      productId,
      brandId,
      groupId,
      subGroupId,
      customerId,
      areaId,
      subAreaId,
      startDate,
      endDate,
      pageNumber,
      pageSize,
      keyword
    } = req.query
    const vendorId = req.vendor.id

    const options = {
      productId,
      brandId,
      groupId,
      subGroupId,
      customerId,
      areaId,
      subAreaId,
      startDate,
      endDate,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10,
      keyword
    }

    const report = await productReportService.getProductReport(vendorId, options)

    console.log('getProductReport response:', util.inspect(report, { depth: null }))
    res.status(200).json(
      createResponse(report, null, 'Product report generated successfully')
    )
  } catch (error) {
    console.error('Error in getProductReport:', error)
    res.status(500).json(
      createResponse(null, error.message || 'Failed to generate product report')
    )
  }
}

/**
 * Get detailed product report for a specific product and customer
 * GET /api/reports/products/:productId/:customerId
 */
exports.getProductDetailedReport = async (req, res) => {
  try {
    const { productId, customerId } = req.params
    const { areaId, subAreaId, startDate, endDate, pageNumber, pageSize, keyword } = req.query
    const vendorId = req.vendor.id

    // Validate params
    if (!productId || !customerId) {
      return res.status(400).json(
        createResponse(null, 'Product ID and Customer ID are required')
      )
    }

    const options = {
      areaId,
      subAreaId,
      startDate,
      endDate,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10,
      keyword
    }

    const report = await productReportService.getProductDetailedReport(
      vendorId,
      productId,
      customerId,
      options
    )

    console.log('getProductDetailedReport response:', util.inspect(report, { depth: null }))
    res.status(200).json(
      createResponse(report, null, 'Product detailed report generated successfully')
    )
  } catch (error) {
    console.error('Error in getProductDetailedReport:', error)

    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(404).json(createResponse(null, error.message))
    }

    res.status(500).json(
      createResponse(null, error.message || 'Failed to generate product detailed report')
    )
  }
}
