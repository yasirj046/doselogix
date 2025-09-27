const PurchaseProduct = require('../models/purchaseProductModel');
const PurchaseEntry = require('../models/purchaseEntryModel');
const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');

exports.getAllPurchaseProducts = async (page, limit, keyword, status, vendorId, productId, purchaseEntryId, batchNumber) => {
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
    
    // Filter by purchase entry if provided
    if (purchaseEntryId && purchaseEntryId !== "") {
      query.purchaseEntryId = purchaseEntryId;
    }
    
    // Filter by batch number if provided
    if (batchNumber && batchNumber !== "") {
      query.batchNumber = { $regex: batchNumber, $options: 'i' };
    }
    
    // Search by keyword in batch number
    if (keyword && keyword !== "") {
      query.$or = [
        { batchNumber: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await PurchaseProduct.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'productId',
          select: 'productName packingSize cartonSize brandId groupId subGroupId'
        },
        {
          path: 'purchaseEntryId',
          select: 'invoiceNumber date brandId'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllPurchaseProducts:', error);
    throw error;
  }
};

exports.getPurchaseProductById = async (id, vendorId) => {
  try {
    const purchaseProduct = await PurchaseProduct.findOne({ _id: id, vendorId })
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('purchaseEntryId', 'invoiceNumber date brandId');
      
    if (!purchaseProduct) {
      throw new Error('Purchase product not found');
    }
    return purchaseProduct;
  } catch (error) {
    throw error;
  }
};

exports.getPurchaseProductsByEntry = async (purchaseEntryId, vendorId) => {
  try {
    return await PurchaseProduct.findByPurchaseEntry(purchaseEntryId, vendorId);
  } catch (error) {
    throw error;
  }
};

exports.getPurchaseProductsByProduct = async (productId, vendorId, options = {}) => {
  try {
    return await PurchaseProduct.findByProduct(productId, vendorId, options);
  } catch (error) {
    throw error;
  }
};

exports.getExpiringPurchaseProducts = async (vendorId, daysFromNow = 90) => {
  try {
    return await PurchaseProduct.findExpiringProducts(vendorId, daysFromNow);
  } catch (error) {
    throw error;
  }
};

exports.getProductPurchaseHistory = async (productId, vendorId, options = {}) => {
  try {
    return await PurchaseProduct.getProductPurchaseHistory(productId, vendorId, options);
  } catch (error) {
    throw error;
  }
};

exports.getBatchDetails = async (productId, vendorId, batchNumber) => {
  try {
    return await PurchaseProduct.getBatchDetails(productId, vendorId, batchNumber);
  } catch (error) {
    throw error;
  }
};

exports.createPurchaseProduct = async (purchaseProductData) => {
  try {
    // Validate purchase entry exists and belongs to vendor
    const purchaseEntry = await PurchaseEntry.findOne({
      _id: purchaseProductData.purchaseEntryId,
      vendorId: purchaseProductData.vendorId
    });

    if (!purchaseEntry) {
      throw new Error('Purchase entry not found or does not belong to this vendor');
    }

    // Validate product exists
    const product = await Product.findById(purchaseProductData.productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if batch already exists for this product and vendor
    const existingBatch = await PurchaseProduct.findOne({
      productId: purchaseProductData.productId,
      vendorId: purchaseProductData.vendorId,
      batchNumber: purchaseProductData.batchNumber
    });
    
    if (existingBatch) {
      throw new Error(`Batch number "${purchaseProductData.batchNumber}" already exists for this product`);
    }

    const purchaseProduct = new PurchaseProduct(purchaseProductData);
    const savedPurchaseProduct = await purchaseProduct.save();
    
    // Update inventory
    await this.updateInventoryForPurchase(savedPurchaseProduct);
    
    // Return the populated purchase product
    return await PurchaseProduct.findById(savedPurchaseProduct._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('purchaseEntryId', 'invoiceNumber date brandId');
  } catch (error) {
    console.error('Error creating purchase product:', error);
    throw error;
  }
};

exports.updatePurchaseProduct = async (vendorId, purchaseProductId, updateData) => {
  try {
    const purchaseProduct = await PurchaseProduct.findOne({ _id: purchaseProductId, vendorId });
    if (!purchaseProduct) {
      throw new Error('Purchase product not found');
    }

    // Validate purchase entry if it's being updated
    if (updateData.purchaseEntryId) {
      const purchaseEntry = await PurchaseEntry.findOne({
        _id: updateData.purchaseEntryId,
        vendorId
      });

      if (!purchaseEntry) {
        throw new Error('Purchase entry not found or does not belong to this vendor');
      }
    }

    // Validate product if it's being updated
    if (updateData.productId) {
      const product = await Product.findById(updateData.productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Check for duplicate batch if product or batch is being updated
      if (updateData.batchNumber || updateData.productId !== purchaseProduct.productId.toString()) {
        const existingBatch = await PurchaseProduct.findOne({
          productId: updateData.productId || purchaseProduct.productId,
          vendorId,
          batchNumber: updateData.batchNumber || purchaseProduct.batchNumber,
          _id: { $ne: purchaseProductId }
        });
        
        if (existingBatch) {
          throw new Error(`Batch number "${updateData.batchNumber || purchaseProduct.batchNumber}" already exists for this product`);
        }
      }
    }

    Object.assign(purchaseProduct, updateData);
    const updatedPurchaseProduct = await purchaseProduct.save();
    
    // Update inventory if quantity or pricing changed
    if (updateData.cartons !== undefined || updateData.pieces !== undefined || 
        updateData.bonus !== undefined || updateData.netPrice !== undefined ||
        updateData.discount !== undefined || updateData.discountType !== undefined ||
        updateData.salePrice !== undefined || updateData.minSalePrice !== undefined ||
        updateData.retailPrice !== undefined || updateData.invoicePrice !== undefined) {
      await this.updateInventoryForPurchase(updatedPurchaseProduct);
    }
    
    // Return the populated purchase product
    return await PurchaseProduct.findById(updatedPurchaseProduct._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('purchaseEntryId', 'invoiceNumber date brandId');
  } catch (error) {
    throw error;
  }
};

exports.deletePurchaseProduct = async (vendorId, purchaseProductId) => {
  try {
    const purchaseProduct = await PurchaseProduct.findOne({ _id: purchaseProductId, vendorId });
    if (!purchaseProduct) {
      throw new Error('Purchase product not found');
    }

    // Reverse inventory changes
    const inventory = await Inventory.findOne({
      productId: purchaseProduct.productId,
      vendorId,
      batchNumber: purchaseProduct.batchNumber
    });

    if (inventory) {
      // Decrease inventory quantity
      inventory.currentQuantity -= (purchaseProduct.quantity + purchaseProduct.bonus);
      
      // Ensure quantity doesn't go negative
      if (inventory.currentQuantity < 0) {
        inventory.currentQuantity = 0;
      }
      
      await inventory.save();
    }

    await PurchaseProduct.findByIdAndDelete(purchaseProductId);
    return { message: 'Purchase product deleted successfully' };
  } catch (error) {
    throw error;
  }
};

exports.togglePurchaseProductStatus = async (vendorId, purchaseProductId) => {
  try {
    const purchaseProduct = await PurchaseProduct.findOne({ _id: purchaseProductId, vendorId });
    if (!purchaseProduct) {
      throw new Error('Purchase product not found');
    }

    purchaseProduct.isActive = !purchaseProduct.isActive;
    const updatedPurchaseProduct = await purchaseProduct.save();
    
    // Update inventory active status
    const inventory = await Inventory.findOne({
      productId: purchaseProduct.productId,
      vendorId,
      batchNumber: purchaseProduct.batchNumber
    });

    if (inventory) {
      inventory.isActive = purchaseProduct.isActive;
      await inventory.save();
    }
    
    // Return the populated purchase product
    return await PurchaseProduct.findById(updatedPurchaseProduct._id)
      .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
      .populate('purchaseEntryId', 'invoiceNumber date brandId');
  } catch (error) {
    throw error;
  }
};

exports.updateInventoryForPurchase = async (purchaseProduct) => {
  try {
    // Get the purchase entry to obtain brandId
    const PurchaseEntry = require('../models/purchaseEntryModel');
    const purchaseEntry = await PurchaseEntry.findById(purchaseProduct.purchaseEntryId)
      .select('brandId');
    
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    const inventoryData = {
      vendorId: purchaseProduct.vendorId,
      productId: purchaseProduct.productId,
      brandId: purchaseEntry.brandId, // Include brandId from purchase entry
      batchNumber: purchaseProduct.batchNumber,
      expiryDate: purchaseProduct.expiryDate,
      lastPurchasePrice: purchaseProduct.effectiveCostPerPiece,
      averageCost: purchaseProduct.effectiveCostPerPiece,
      salePrice: purchaseProduct.salePrice,
      minSalePrice: purchaseProduct.minSalePrice,
      retailPrice: purchaseProduct.retailPrice,
      invoicePrice: purchaseProduct.invoicePrice,
      isActive: purchaseProduct.isActive
    };
    
    // Check if inventory exists
    const existingInventory = await Inventory.findOne({
      vendorId: purchaseProduct.vendorId,
      productId: purchaseProduct.productId,
      batchNumber: purchaseProduct.batchNumber
    });
    
    if (existingInventory) {
      // Update existing inventory - only update quantity if it's a new addition
      const totalQuantity = purchaseProduct.quantity + purchaseProduct.bonus;
      
      // If this is an update to existing purchase product, we need to handle quantity changes
      // For now, we'll update the pricing but keep the current quantity
      Object.assign(existingInventory, inventoryData);
      await existingInventory.save();
      return existingInventory;
    } else {
      // Create new inventory
      inventoryData.currentQuantity = purchaseProduct.quantity + purchaseProduct.bonus;
      const inventory = new Inventory(inventoryData);
      return await inventory.save();
    }
  } catch (error) {
    throw error;
  }
};
