const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');

exports.getAllInventory = async (page, limit, keyword, status, vendorId, productId, batchNumber, stockStatus) => {
  try {
    let query = { vendorId };
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
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
    
    // Search by keyword in batch number or product name
    if (keyword && keyword !== "") {
      // For keyword search, we'll need to populate and filter
      const inventoryItems = await Inventory.find(query)
        .populate({
          path: 'productId',
          match: { productName: { $regex: keyword, $options: 'i' } }
        })
        .sort({ lastUpdated: -1 });
      
      // Filter out items where productId is null (due to population match)
      const filteredItems = inventoryItems.filter(item => item.productId !== null);
      
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
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    throw error;
  }
};
