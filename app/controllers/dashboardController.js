const dashboardService = require('../services/dashboardService');

/**
 * Dashboard Controller
 * Handles HTTP requests and delegates business logic to service layer
 * All routes protected by authentication middleware
 */

/**
 * Get dashboard summary cards data
 */
exports.getSummaryCards = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const data = await dashboardService.getSummaryCards(vendorId);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching summary cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary cards',
      error: error.message
    });
  }
};

/**
 * Get brand-wise sales data for bar chart
 */
exports.getBrandWiseSales = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate, limit = 10 } = req.query;

    const data = await dashboardService.getBrandWiseSales(vendorId, startDate, endDate, limit);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching brand-wise sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand-wise sales',
      error: error.message
    });
  }
};

/**
 * Get top selling products
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate, limit = 5 } = req.query;

    const result = await dashboardService.getTopSellingProducts(vendorId, startDate, endDate, limit);

    res.status(200).json({
      success: true,
      data: result.products,
      meta: {
        totalRevenue: result.totalRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top selling products',
      error: error.message
    });
  }
};

/**
 * Get receivables aging analysis
 */
exports.getReceivablesAging = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const result = await dashboardService.getReceivablesAging(vendorId);

    res.status(200).json({
      success: true,
      data: result  // Return the complete result object
    });

  } catch (error) {
    console.error('Error fetching receivables aging:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receivables aging',
      error: error.message
    });
  }
};

/**
 * Get stock alerts
 */
exports.getStockAlerts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { limit = 20 } = req.query;

    const data = await dashboardService.getStockAlerts(vendorId, limit);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock alerts',
      error: error.message
    });
  }
};

/**
 * Get near-expiry products
 */
exports.getNearExpiryProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { limit = 20 } = req.query;

    const data = await dashboardService.getNearExpiryProducts(vendorId, limit);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching near-expiry products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch near-expiry products',
      error: error.message
    });
  }
};

/**
 * Get area-wise sales
 */
exports.getAreaWiseSales = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate, limit = 10 } = req.query;

    const data = await dashboardService.getAreaWiseSales(vendorId, startDate, endDate, limit);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching area-wise sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch area-wise sales',
      error: error.message
    });
  }
};

/**
 * Get invoice breakdown
 */
exports.getInvoiceBreakdown = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate } = req.query;

    const data = await dashboardService.getInvoiceBreakdown(vendorId, startDate, endDate);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching invoice breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice breakdown',
      error: error.message
    });
  }
};

/**
 * Get complete dashboard
 */
exports.getCompleteDashboard = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate } = req.query;

    const data = await dashboardService.getCompleteDashboard(vendorId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: {
        summaryCards: data.summaryCards,
        brandWiseSales: data.brandWiseSales,
        topProducts: data.topProducts,
        receivablesAging: data.receivablesAging,
        stockAlerts: data.stockAlerts,
        nearExpiry: data.nearExpiry,
        areaWiseSales: data.areaWiseSales,
        invoiceBreakdown: data.invoiceBreakdown
      },
      meta: data.meta
    });

  } catch (error) {
    console.error('Error fetching complete dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complete dashboard',
      error: error.message
    });
  }
};
