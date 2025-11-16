const brandReportService = require('../services/brandReportService');
const { createResponse } = require('../util/util');
const util = require('util');

/**
 * Get brand report for a specific brand
 * GET /api/reports/brands/:brandId
 */
exports.getBrandReport = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { 
      startDate, 
      endDate,
      paymentStatus,
      pageNumber,
      pageSize,
      keyword
    } = req.query;
    const vendorId = req.vendor.id;

    // Validate brandId
    if (!brandId) {
      return res.status(400).json(
        createResponse(null, 'Brand ID is required')
      );
    }

    const options = {
      startDate,
      endDate,
      paymentStatus,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10,
      keyword
    };

    const report = await brandReportService.getBrandReport(
      vendorId,
      brandId,
      options
    );

    // Log the complete report object before sending to frontend for debugging
    console.log('getBrandReport response:', util.inspect(report, { depth: null }));
    res.status(200).json(
      createResponse(report, null, 'Brand report generated successfully')
    );
  } catch (error) {
    console.error('Error in getBrandReport:', error);
    
    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    
    res.status(500).json(
      createResponse(null, error.message || 'Failed to generate brand report')
    );
  }
};

/**
 * Get brands report summary (all brands)
 * GET /api/reports/brands
 */
exports.getBrandsReportSummary = async (req, res) => {
  try {
    const { 
      brandId,
      startDate, 
      endDate,
      paymentStatus,
      pageNumber,
      pageSize
    } = req.query;
    const vendorId = req.vendor.id;

    const options = {
      brandId,
      startDate,
      endDate,
      paymentStatus,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10
    };

    const report = await brandReportService.getBrandsReportSummary(vendorId, options);

    // Log the complete brands report summary before sending to frontend for debugging
    console.log('getBrandsReportSummary response:', util.inspect(report, { depth: null }));
    res.status(200).json(
      createResponse(report, null, 'Brands report summary generated successfully')
    );
  } catch (error) {
    console.error('Error in getBrandsReportSummary:', error);
    res.status(500).json(
      createResponse(null, error.message || 'Failed to generate brands report summary')
    );
  }
};

module.exports = exports;
