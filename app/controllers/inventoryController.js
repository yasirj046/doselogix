const inventoryService = require('../services/inventoryService');
const { createResponse } = require('../util/util');

exports.getAllInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const productId = req.query.productId || "";
    const batchNumber = req.query.batchNumber || "";
    const stockStatus = req.query.stockStatus || "";
    const vendorId = req.vendor.id;

    const result = await inventoryService.getAllInventory(page, limit, keyword, status, vendorId, productId, batchNumber, stockStatus);
    
    res.status(200).json(
      createResponse(result, null, "Inventory retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllInventory:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const inventory = await inventoryService.getInventoryById(id, vendorId);
    
    if (!inventory) {
      return res.status(404).json(createResponse(null, "Inventory item not found"));
    }

    res.status(200).json(
      createResponse(inventory, null, "Inventory item retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getInventoryById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const vendorId = req.vendor.id;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
    const batchNumber = req.query.batchNumber || null;
    const minQuantity = req.query.minQuantity ? parseInt(req.query.minQuantity) : null;
    const maxQuantity = req.query.maxQuantity ? parseInt(req.query.maxQuantity) : null;

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (batchNumber) options.batchNumber = batchNumber;
    if (minQuantity !== null) options.minQuantity = minQuantity;
    if (maxQuantity !== null) options.maxQuantity = maxQuantity;

    const inventory = await inventoryService.getInventoryByProduct(productId, vendorId, options);
    
    res.status(200).json(
      createResponse(inventory, null, "Inventory by product retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getInventoryByProduct:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const threshold = parseInt(req.query.threshold) || 10;

    const lowStockItems = await inventoryService.getLowStockItems(vendorId, threshold);
    
    res.status(200).json(
      createResponse(lowStockItems, null, "Low stock items retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getLowStockItems:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getOutOfStockItems = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const outOfStockItems = await inventoryService.getOutOfStockItems(vendorId);
    
    res.status(200).json(
      createResponse(outOfStockItems, null, "Out of stock items retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getOutOfStockItems:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpiringProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const daysFromNow = parseInt(req.query.daysFromNow) || 90;

    const expiringProducts = await inventoryService.getExpiringProducts(vendorId, daysFromNow);
    
    res.status(200).json(
      createResponse(expiringProducts, null, "Expiring products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpiringProducts:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpiredProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const expiredProducts = await inventoryService.getExpiredProducts(vendorId);
    
    res.status(200).json(
      createResponse(expiredProducts, null, "Expired products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpiredProducts:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getInventorySummary = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const summary = await inventoryService.getInventorySummary(vendorId);
    
    res.status(200).json(
      createResponse(summary, null, "Inventory summary retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getInventorySummary:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getInventoryValue = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const value = await inventoryService.getInventoryValue(vendorId);
    
    res.status(200).json(
      createResponse(value, null, "Inventory value retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getInventoryValue:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.reserveStock = async (req, res) => {
  try {
    const { productId, batchNumber, quantity } = req.body;
    const vendorId = req.vendor.id;

    if (!productId || !batchNumber || quantity === undefined) {
      return res.status(400).json(
        createResponse(null, "Product ID, batch number, and quantity are required")
      );
    }

    const inventory = await inventoryService.reserveStock(productId, vendorId, batchNumber, quantity);
    
    res.status(200).json(
      createResponse(inventory, null, "Stock reserved successfully")
    );
  } catch (error) {
    console.error('Error in reserveStock:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.releaseReservedStock = async (req, res) => {
  try {
    const { productId, batchNumber, quantity } = req.body;
    const vendorId = req.vendor.id;

    if (!productId || !batchNumber || quantity === undefined) {
      return res.status(400).json(
        createResponse(null, "Product ID, batch number, and quantity are required")
      );
    }

    const inventory = await inventoryService.releaseReservedStock(productId, vendorId, batchNumber, quantity);
    
    res.status(200).json(
      createResponse(inventory, null, "Reserved stock released successfully")
    );
  } catch (error) {
    console.error('Error in releaseReservedStock:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId, batchNumber, quantityChange, operation } = req.body;
    const vendorId = req.vendor.id;

    if (!productId || !batchNumber || quantityChange === undefined) {
      return res.status(400).json(
        createResponse(null, "Product ID, batch number, and quantity change are required")
      );
    }

    const inventory = await inventoryService.updateStock(productId, vendorId, batchNumber, quantityChange, operation || 'add');
    
    res.status(200).json(
      createResponse(inventory, null, "Stock updated successfully")
    );
  } catch (error) {
    console.error('Error in updateStock:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createInventory = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const inventoryData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['productId', 'batchNumber', 'expiryDate', 'currentQuantity', 'lastPurchasePrice', 'averageCost', 'salePrice', 'minSalePrice', 'retailPrice', 'invoicePrice'];
    const missingFields = requiredFields.filter(field => inventoryData[field] === undefined || inventoryData[field] === null);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Validate expiry date
    if (inventoryData.expiryDate) inventoryData.expiryDate = new Date(inventoryData.expiryDate);

    // Trim string fields
    if (inventoryData.batchNumber) inventoryData.batchNumber = inventoryData.batchNumber.trim();

    const createdInventory = await inventoryService.createInventory(inventoryData);
    
    res.status(201).json(createResponse(createdInventory, null, "Inventory created successfully"));
  } catch (error) {
    console.error('Create inventory error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Validate expiry date if provided
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

    // Trim string fields if they exist in updateData
    if (updateData.batchNumber) {
      updateData.batchNumber = updateData.batchNumber.trim();
    }

    const updatedInventory = await inventoryService.updateInventory(vendorId, inventoryId, updateData);
    
    res.status(200).json(
      createResponse(updatedInventory, null, "Inventory updated successfully")
    );
  } catch (error) {
    console.error('Update inventory error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.message === 'Inventory item not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await inventoryService.deleteInventory(vendorId, inventoryId);
    
    res.status(200).json(
      createResponse(result, null, "Inventory item deleted successfully")
    );
  } catch (error) {
    console.error('Delete inventory error:', error);
    if (error.message === 'Inventory item not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleInventoryStatus = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedInventory = await inventoryService.toggleInventoryStatus(vendorId, inventoryId);
    
    res.status(200).json(
      createResponse(updatedInventory, null, `Inventory item ${updatedInventory.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle inventory status error:', error);
    if (error.message === 'Inventory item not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.adjustInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const vendorId = req.vendor.id;
    const { adjustmentType, quantity, reason } = req.body;

    if (!adjustmentType || quantity === undefined) {
      return res.status(400).json(
        createResponse(null, "Adjustment type and quantity are required")
      );
    }

    if (!['add', 'subtract'].includes(adjustmentType)) {
      return res.status(400).json(
        createResponse(null, "Adjustment type must be 'add' or 'subtract'")
      );
    }

    const adjustmentData = { adjustmentType, quantity, reason };
    const updatedInventory = await inventoryService.adjustInventory(vendorId, inventoryId, adjustmentData);
    
    res.status(200).json(
      createResponse(updatedInventory, null, "Inventory adjusted successfully")
    );
  } catch (error) {
    console.error('Error in adjustInventory:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
