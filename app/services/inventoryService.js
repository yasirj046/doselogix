const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');

exports.getAllInventory = async (page, limit, keyword, status, vendorId, productId, batchNumber, stockStatus, brandId) => {
  try {
    let query = { vendorId };
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Filter by brand if provided
    if (brandId && brandId !== "") {
      query.brandId = brandId;
    }
    
    // Filter by product if provided
    if (productId && productId !== "") {
      query.productId = productId;
    }
    
    // Filter by batch number if provided
    if (batchNumber && batchNumber !== "") {
      query.batchNumber = { $regex: batchNumber, $options: 'i' };
    }
    
    // Filter by stock status
    if (stockStatus && stockStatus !== "") {
      switch (stockStatus) {
        case 'out_of_stock':
          query.currentQuantity = 0;
          break;
        case 'low_stock':
          query.currentQuantity = { $gt: 0, $lte: 10 };
          break;
        case 'in_stock':
          query.currentQuantity = { $gt: 10 };
          break;
        case 'reserved':
          query.$expr = { $eq: ['$currentQuantity', '$reservedQuantity'] };
          query.currentQuantity = { $gt: 0 };
          break;
      }
    }
    
    // Search by keyword in batch number, product name, or brand name
    if (keyword && keyword !== "") {
      // For keyword search, we'll need to populate and filter
      const inventoryItems = await Inventory.find(query)
        .populate({
          path: 'productId',
          match: { productName: { $regex: keyword, $options: 'i' } }
        })
        .populate({
          path: 'brandId',
          match: { brandName: { $regex: keyword, $options: 'i' } }
        })
        .sort({ lastUpdated: -1 });
      
      // Filter out items where productId or brandId is null (due to population match)
      const filteredItems = inventoryItems.filter(item => 
        (item.productId !== null || item.brandId !== null)
      );
      
      // Manual pagination for keyword search
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      
      return {
        docs: paginatedItems,
        totalDocs: filteredItems.length,
        limit,
        page,
        totalPages: Math.ceil(filteredItems.length / limit),
        pagingCounter: startIndex + 1,
        hasPrevPage: page > 1,
        hasNextPage: endIndex < filteredItems.length,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: endIndex < filteredItems.length ? page + 1 : null
      };
    }

    return await Inventory.paginate(query, { 
      page, 
      limit,
      sort: { lastUpdated: -1 },
      populate: [
        {
          path: 'productId',
          select: 'productName packingSize cartonSize brandId groupId subGroupId'
        },
        {
          path: 'brandId',
          select: 'brandName'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllInventory:', error);
    throw error;
  }
};

exports.getInventoryById = async (id, vendorId) => {
  try {
    const inventory = await Inventory.findOne({ _id: id, vendorId })
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('vendorId', 'vendorName vendorEmail');
      
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    return inventory;
  } catch (error) {
    throw error;
  }
};

exports.getInventoryByProduct = async (productId, vendorId, options = {}) => {
  try {
    return await Inventory.findByProduct(productId, vendorId, options);
  } catch (error) {
    throw error;
  }
};

exports.getLowStockItems = async (vendorId, threshold = 10) => {
  try {
    return await Inventory.findLowStock(vendorId, threshold);
  } catch (error) {
    throw error;
  }
};

exports.getOutOfStockItems = async (vendorId) => {
  try {
    return await Inventory.findOutOfStock(vendorId);
  } catch (error) {
    throw error;
  }
};

exports.getExpiringProducts = async (vendorId, daysFromNow = 90) => {
  try {
    return await Inventory.findExpiringProducts(vendorId, daysFromNow);
  } catch (error) {
    throw error;
  }
};

exports.getExpiredProducts = async (vendorId) => {
  try {
    return await Inventory.findExpiredProducts(vendorId);
  } catch (error) {
    throw error;
  }
};

exports.getInventorySummary = async (vendorId) => {
  try {
    return await Inventory.getInventorySummary(vendorId);
  } catch (error) {
    throw error;
  }
};

exports.getInventoryValue = async (vendorId) => {
  try {
    return await Inventory.getInventoryValue(vendorId);
  } catch (error) {
    throw error;
  }
};

exports.reserveStock = async (productId, vendorId, batchNumber, quantity) => {
  try {
    return await Inventory.reserveStock(productId, vendorId, batchNumber, quantity);
  } catch (error) {
    throw error;
  }
};

exports.releaseReservedStock = async (productId, vendorId, batchNumber, quantity) => {
  try {
    return await Inventory.releaseReservedStock(productId, vendorId, batchNumber, quantity);
  } catch (error) {
    throw error;
  }
};

exports.updateStock = async (productId, vendorId, batchNumber, quantityChange, operation = 'add') => {
  try {
    return await Inventory.updateStock(productId, vendorId, batchNumber, quantityChange, operation);
  } catch (error) {
    throw error;
  }
};

exports.createInventory = async (inventoryData) => {
  try {
    // Validate product exists
    const product = await Product.findById(inventoryData.productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if inventory already exists for this batch
    const existingInventory = await Inventory.findOne({
      productId: inventoryData.productId,
      vendorId: inventoryData.vendorId,
      batchNumber: inventoryData.batchNumber
    });
    
    if (existingInventory) {
      throw new Error(`Inventory already exists for batch "${inventoryData.batchNumber}" of this product`);
    }

    const inventory = new Inventory(inventoryData);
    const savedInventory = await inventory.save();
    
    // Return the populated inventory
    return await Inventory.findById(savedInventory._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
};

exports.updateInventory = async (vendorId, inventoryId, updateData) => {
  try {
    const inventory = await Inventory.findOne({ _id: inventoryId, vendorId });
    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    // Validate product if it's being updated
    if (updateData.productId) {
      const product = await Product.findById(updateData.productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Check for duplicate batch if product or batch is being updated
      if (updateData.batchNumber || updateData.productId !== inventory.productId.toString()) {
        const existingInventory = await Inventory.findOne({
          productId: updateData.productId || inventory.productId,
          vendorId,
          batchNumber: updateData.batchNumber || inventory.batchNumber,
          _id: { $ne: inventoryId }
        });
        
        if (existingInventory) {
          throw new Error(`Inventory already exists for batch "${updateData.batchNumber || inventory.batchNumber}" of this product`);
        }
      }
    }

    Object.assign(inventory, updateData);
    const updatedInventory = await inventory.save();
    
    // Return the populated inventory
    return await Inventory.findById(updatedInventory._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    throw error;
  }
};

exports.deleteInventory = async (vendorId, inventoryId) => {
  try {
    const inventory = await Inventory.findOne({ _id: inventoryId, vendorId });
    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    await Inventory.findByIdAndDelete(inventoryId);
    return { message: 'Inventory item deleted successfully' };
  } catch (error) {
    throw error;
  }
};

exports.toggleInventoryStatus = async (vendorId, inventoryId) => {
  try {
    const inventory = await Inventory.findOne({ _id: inventoryId, vendorId });
    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    inventory.isActive = !inventory.isActive;
    const updatedInventory = await inventory.save();
    
    // Return the populated inventory
    return await Inventory.findById(updatedInventory._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    throw error;
  }
};

exports.adjustInventory = async (vendorId, inventoryId, adjustmentData) => {
  try {
    const { adjustmentType, quantity, reason } = adjustmentData;
    
    const inventory = await Inventory.findOne({ _id: inventoryId, vendorId });
    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    if (adjustmentType === 'add') {
      inventory.currentQuantity += quantity;
    } else if (adjustmentType === 'subtract') {
      if (inventory.availableQuantity < quantity) {
        throw new Error('Insufficient available quantity for adjustment');
      }
      inventory.currentQuantity -= quantity;
    } else {
      throw new Error('Invalid adjustment type. Use "add" or "subtract"');
    }

    // Ensure quantity doesn't go negative
    if (inventory.currentQuantity < 0) {
      inventory.currentQuantity = 0;
    }

    inventory.lastUpdated = new Date();
    const updatedInventory = await inventory.save();
    
    // Return the populated inventory
    return await Inventory.findById(updatedInventory._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('brandId', 'brandName')
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    throw error;
  }
};

// New service method for grouped inventory view
exports.getGroupedInventory = async (page, limit, keyword, status, vendorId, brandId, productId, stockStatus) => {
  try {
    const options = {};
    
    // Add filters to options
    if (brandId && brandId !== "") options.brandId = brandId;
    if (productId && productId !== "") options.productId = productId;
    if (stockStatus && stockStatus !== "") options.stockStatus = stockStatus;
    if (keyword && keyword !== "") options.keyword = keyword;
    if (status && status !== "") options.status = status;

    // Get grouped inventory data
    const groupedData = await Inventory.getGroupedInventory(vendorId, options);
    
    // Manual pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = groupedData.slice(startIndex, endIndex);
    
    // Transform the data to match the required format
    const transformedData = paginatedData.map(item => ({
      productId: item._id.productId,
      productName: item._id.productName,
      brandId: item._id.brandId,
      brandName: item._id.brandName,
      packingSize: item._id.packingSize,
      cartonSize: item._id.cartonSize,
      groupId: item._id.groupId,
      subGroupId: item._id.subGroupId,
      totalQuantity: item.totalQuantity,
      totalBatches: item.totalBatches,
      availableQuantity: item.availableQuantity,
      overallStockStatus: item.overallStockStatus,
      lowStockBatches: item.lowStockBatches,
      outOfStockBatches: item.outOfStockBatches,
      expiredBatches: item.expiredBatches,
      expiringSoonBatches: item.expiringSoonBatches,
      lastUpdated: item.lastUpdated,
      batches: item.batches // This contains all batch details for the modal
    }));

    return {
      docs: transformedData,
      totalDocs: groupedData.length,
      limit,
      page,
      totalPages: Math.ceil(groupedData.length / limit),
      pagingCounter: startIndex + 1,
      hasPrevPage: page > 1,
      hasNextPage: endIndex < groupedData.length,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: endIndex < groupedData.length ? page + 1 : null
    };
  } catch (error) {
    console.error('Error in getGroupedInventory:', error);
    throw error;
  }
};

// Service method to get batch details for a specific product (for modal)
exports.getBatchDetailsByProduct = async (vendorId, productId) => {
  try {
    const batches = await Inventory.find({
      vendorId,
      productId,
      isActive: true
    })
    .populate('productId', 'productName packingSize cartonSize')
    .populate('brandId', 'brandName')
    .sort({ expiryDate: 1 });

    return batches;
  } catch (error) {
    console.error('Error in getBatchDetailsByProduct:', error);
    throw error;
  }
};
