const purchaseProductService = require('../services/purchaseProductService');
const { createResponse } = require('../util/util');

exports.getAllPurchaseProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const productId = req.query.productId || "";
    const purchaseEntryId = req.query.purchaseEntryId || "";
    const batchNumber = req.query.batchNumber || "";
    const vendorId = req.vendor.id;

    const result = await purchaseProductService.getAllPurchaseProducts(page, limit, keyword, status, vendorId, productId, purchaseEntryId, batchNumber);
    
    res.status(200).json(
      createResponse(result, null, "Purchase products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllPurchaseProducts:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getPurchaseProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const purchaseProduct = await purchaseProductService.getPurchaseProductById(id, vendorId);
    
    if (!purchaseProduct) {
      return res.status(404).json(createResponse(null, "Purchase product not found"));
    }

    res.status(200).json(
      createResponse(purchaseProduct, null, "Purchase product retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getPurchaseProductById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getPurchaseProductsByEntry = async (req, res) => {
  try {
    const { purchaseEntryId } = req.params;
    const vendorId = req.vendor.id;

    const purchaseProducts = await purchaseProductService.getPurchaseProductsByEntry(purchaseEntryId, vendorId);
    
    res.status(200).json(
      createResponse(purchaseProducts, null, "Purchase products by entry retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getPurchaseProductsByEntry:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getPurchaseProductsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const vendorId = req.vendor.id;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
    const batchNumber = req.query.batchNumber || null;
    const expiryBefore = req.query.expiryBefore ? new Date(req.query.expiryBefore) : null;
    const expiryAfter = req.query.expiryAfter ? new Date(req.query.expiryAfter) : null;

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (batchNumber) options.batchNumber = batchNumber;
    if (expiryBefore) options.expiryBefore = expiryBefore;
    if (expiryAfter) options.expiryAfter = expiryAfter;

    const purchaseProducts = await purchaseProductService.getPurchaseProductsByProduct(productId, vendorId, options);
    
    res.status(200).json(
      createResponse(purchaseProducts, null, "Purchase products by product retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getPurchaseProductsByProduct:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpiringPurchaseProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const daysFromNow = parseInt(req.query.daysFromNow) || 90;

    const purchaseProducts = await purchaseProductService.getExpiringPurchaseProducts(vendorId, daysFromNow);
    
    res.status(200).json(
      createResponse(purchaseProducts, null, "Expiring purchase products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpiringPurchaseProducts:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getProductPurchaseHistory = async (req, res) => {
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

    const history = await purchaseProductService.getProductPurchaseHistory(productId, vendorId, options);
    
    res.status(200).json(
      createResponse(history, null, "Product purchase history retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductPurchaseHistory:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getBatchDetails = async (req, res) => {
  try {
    const { productId, batchNumber } = req.params;
    const vendorId = req.vendor.id;

    const batchDetails = await purchaseProductService.getBatchDetails(productId, vendorId, batchNumber);
    
    if (!batchDetails) {
      return res.status(404).json(createResponse(null, "Batch not found"));
    }

    res.status(200).json(
      createResponse(batchDetails, null, "Batch details retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getBatchDetails:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createPurchaseProduct = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const purchaseProductData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['purchaseEntryId', 'productId', 'batchNumber', 'expiryDate', 'cartons', 'pieces', 'netPrice', 'salePrice', 'minSalePrice', 'retailPrice', 'invoicePrice'];
    const missingFields = requiredFields.filter(field => purchaseProductData[field] === undefined || purchaseProductData[field] === null);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Validate expiry date
    if (purchaseProductData.expiryDate) purchaseProductData.expiryDate = new Date(purchaseProductData.expiryDate);

    // Trim string fields
    if (purchaseProductData.batchNumber) purchaseProductData.batchNumber = purchaseProductData.batchNumber.trim();

    const createdPurchaseProduct = await purchaseProductService.createPurchaseProduct(purchaseProductData);
    
    res.status(201).json(createResponse(createdPurchaseProduct, null, "Purchase product created successfully"));
  } catch (error) {
    console.error('Create purchase product error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updatePurchaseProduct = async (req, res) => {
  try {
    const purchaseProductId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Validate expiry date if provided
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

    // Trim string fields if they exist in updateData
    if (updateData.batchNumber) {
      updateData.batchNumber = updateData.batchNumber.trim();
    }

    const updatedPurchaseProduct = await purchaseProductService.updatePurchaseProduct(vendorId, purchaseProductId, updateData);
    
    res.status(200).json(
      createResponse(updatedPurchaseProduct, null, "Purchase product updated successfully")
    );
  } catch (error) {
    console.error('Update purchase product error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.message === 'Purchase product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deletePurchaseProduct = async (req, res) => {
  try {
    const purchaseProductId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await purchaseProductService.deletePurchaseProduct(vendorId, purchaseProductId);
    
    res.status(200).json(
      createResponse(result, null, "Purchase product deleted successfully")
    );
  } catch (error) {
    console.error('Delete purchase product error:', error);
    if (error.message === 'Purchase product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.togglePurchaseProductStatus = async (req, res) => {
  try {
    const purchaseProductId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedPurchaseProduct = await purchaseProductService.togglePurchaseProductStatus(vendorId, purchaseProductId);
    
    res.status(200).json(
      createResponse(updatedPurchaseProduct, null, `Purchase product ${updatedPurchaseProduct.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle purchase product status error:', error);
    if (error.message === 'Purchase product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};
