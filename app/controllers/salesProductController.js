const salesProductService = require('../services/salesProductService');
const { createResponse } = require('../util/util');

exports.getAllSalesProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const productId = req.query.productId || "";
    const salesInvoiceId = req.query.salesInvoiceId || "";
    const batchNumber = req.query.batchNumber || "";
    const vendorId = req.vendor.id;

    const result = await salesProductService.getAllSalesProducts(
      page, 
      limit, 
      keyword, 
      status, 
      vendorId, 
      productId, 
      salesInvoiceId, 
      batchNumber
    );
    
    res.status(200).json(
      createResponse(result, null, "Sales products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllSalesProducts:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getSalesProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const salesProduct = await salesProductService.getSalesProductById(id, vendorId);
    
    if (!salesProduct) {
      return res.status(404).json(createResponse(null, "Sales product not found"));
    }

    res.status(200).json(
      createResponse(salesProduct, null, "Sales product retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesProductById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesProductsBySalesInvoice = async (req, res) => {
  try {
    const { salesInvoiceId } = req.params;
    const vendorId = req.vendor.id;

    const salesProducts = await salesProductService.getSalesProductsBySalesInvoice(salesInvoiceId, vendorId);
    
    res.status(200).json(
      createResponse(salesProducts, null, "Sales products by invoice retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesProductsBySalesInvoice:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesProductsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const vendorId = req.vendor.id;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
    const batchNumber = req.query.batchNumber || null;
    const expiryBefore = req.query.expiryBefore ? new Date(req.query.expiryBefore) : null;
    const expiryAfter = req.query.expiryAfter ? new Date(req.query.expiryAfter) : null;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (batchNumber) options.batchNumber = batchNumber;
    if (expiryBefore) options.expiryBefore = expiryBefore;
    if (expiryAfter) options.expiryAfter = expiryAfter;
    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const salesProducts = await salesProductService.getSalesProductsByProduct(productId, vendorId, options);
    
    res.status(200).json(
      createResponse(salesProducts, null, "Sales products by product retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesProductsByProduct:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpiringSalesProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const daysFromNow = parseInt(req.query.daysFromNow) || 30;

    const salesProducts = await salesProductService.getExpiringSalesProducts(vendorId, daysFromNow);
    
    res.status(200).json(
      createResponse(salesProducts, null, "Expiring sales products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpiringSalesProducts:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getProductSalesHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const vendorId = req.vendor.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const options = {};
    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const history = await salesProductService.getProductSalesHistory(productId, vendorId, options);
    
    res.status(200).json(
      createResponse(history, null, "Product sales history retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductSalesHistory:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getBatchSalesHistory = async (req, res) => {
  try {
    const { productId, batchNumber } = req.params;
    const vendorId = req.vendor.id;

    const batchHistory = await salesProductService.getBatchSalesHistory(productId, vendorId, batchNumber);
    
    if (!batchHistory || batchHistory.length === 0) {
      return res.status(404).json(createResponse(null, "No sales found for this batch"));
    }

    res.status(200).json(
      createResponse(batchHistory, null, "Batch sales history retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getBatchSalesHistory:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateSalesProduct = async (req, res) => {
  try {
    const salesProductId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    const updatedSalesProduct = await salesProductService.updateSalesProduct(vendorId, salesProductId, updateData);
    
    res.status(200).json(
      createResponse(updatedSalesProduct, null, "Sales product updated successfully")
    );
  } catch (error) {
    console.error('Update sales product error:', error);
    if (error.message === 'Sales product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    if (error.message.includes('Insufficient inventory')) {
      return res.status(400).json(createResponse(null, error.message));
    }
    if (error.message.includes('below minimum price')) {
      return res.status(400).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteSalesProduct = async (req, res) => {
  try {
    const salesProductId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await salesProductService.deleteSalesProduct(vendorId, salesProductId);
    
    res.status(200).json(
      createResponse(result, null, "Sales product deleted successfully")
    );
  } catch (error) {
    console.error('Delete sales product error:', error);
    if (error.message === 'Sales product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleSalesProductStatus = async (req, res) => {
  try {
    const salesProductId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedSalesProduct = await salesProductService.toggleSalesProductStatus(vendorId, salesProductId);
    
    res.status(200).json(
      createResponse(updatedSalesProduct, null, `Sales product ${updatedSalesProduct.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle sales product status error:', error);
    if (error.message === 'Sales product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesProductsByBatch = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const vendorId = req.vendor.id;
    const productId = req.query.productId || null;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

    const options = {};
    if (productId) options.productId = productId;
    if (isActive !== undefined) options.isActive = isActive;

    const salesProducts = await salesProductService.getSalesProductsByBatch(batchNumber, vendorId, options);
    
    res.status(200).json(
      createResponse(salesProducts, null, "Sales products by batch retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesProductsByBatch:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getInventoryAvailableForSale = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const productId = req.query.productId || null;

    const availableInventory = await salesProductService.getInventoryAvailableForSale(vendorId, productId);
    
    res.status(200).json(
      createResponse(availableInventory, null, "Available inventory for sale retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getInventoryAvailableForSale:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesAnalytics = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const productId = req.query.productId || null;

    const options = {};
    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }
    if (productId) {
      options.productId = productId;
    }

    const analytics = await salesProductService.getSalesAnalytics(vendorId, options);
    
    res.status(200).json(
      createResponse(analytics, null, "Sales analytics retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesAnalytics:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
