const customerReportService = require('../services/customerReportService');
const { createResponse } = require('../util/util');
const util = require('util');

/**
 * Get customer report for a specific customer
 * GET /api/reports/customers/:customerId
 */
exports.getCustomerReport = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { 
      startDate, 
      endDate,
      paymentStatus,
      pageNumber,
      pageSize,
      keyword
    } = req.query;
    const vendorId = req.vendor.id;

    // Validate customerId
    if (!customerId) {
      return res.status(400).json(
        createResponse(null, 'Customer ID is required')
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

    const report = await customerReportService.getCustomerReport(
      vendorId,
      customerId,
      options
    );

    // Log the complete report object before sending to frontend for debugging
    console.log('getCustomerReport response:', util.inspect(report, { depth: null }));
    res.status(200).json(
      createResponse(report, null, 'Customer report generated successfully')
    );
  } catch (error) {
    console.error('Error in getCustomerReport:', error);
    
    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    
    res.status(500).json(
      createResponse(null, error.message || 'Failed to generate customer report')
    );
  }
};

/**
 * Get customers report summary (all customers)
 * GET /api/reports/customers
 */
exports.getCustomersReportSummary = async (req, res) => {
  try {
    const { 
      customerId,
      startDate, 
      endDate,
      paymentStatus,
      pageNumber,
      pageSize
    } = req.query;
    const vendorId = req.vendor.id;

    const options = {
      customerId,
      startDate,
      endDate,
      paymentStatus,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10
    };

    const report = await customerReportService.getCustomersReportSummary(vendorId, options);

    // Log the complete customers report summary before sending to frontend for debugging
    console.log('getCustomersReportSummary response:', util.inspect(report, { depth: null }));
    res.status(200).json(
      createResponse(report, null, 'Customers report summary generated successfully')
    );
  } catch (error) {
    console.error('Error in getCustomersReportSummary:', error);
    res.status(500).json(
      createResponse(null, error.message || 'Failed to generate customers report summary')
    );
  }
};

module.exports = exports;
