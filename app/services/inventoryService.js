const Inventory = require("../models/inventoryModel");
const InventoryCounter = require("../models/inventoryCounterModel");
const Brand = require("../models/brandModel");
const Product = require("../models/productModel");
const ledgerService = require("./ledgerService");
const notificationService = require("./notificationService");
const settingsService = require("./settingsService");
const mongoose = require("mongoose");

// Generate unique inventory ID
const generateInventoryId = async () => {
  const counter = await InventoryCounter.findByIdAndUpdate(
    { _id: "inventoryId" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return `INV-${counter.sequence_value.toString().padStart(6, "0")}`;
};

// Calculate product quantities and amounts
const calculateProductAmounts = (product) => {
  const { cartons, pieces, bonus, cartonSize, netPrice, discountPercentage } = product;
  
  // Calculate quantities
  const orderedQuantity = (cartons * cartonSize) + pieces;
  const totalQuantity = orderedQuantity + (bonus * cartonSize);
  
  // Calculate amounts
  const grossAmount = orderedQuantity * netPrice;
  const discountAmount = (grossAmount * discountPercentage) / 100;
  const totalAmount = grossAmount - discountAmount;
  const effectivePricePerPiece = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
  
  return {
    orderedQuantity,
    totalQuantity,
    grossAmount,
    discountAmount,
    totalAmount,
    effectivePricePerPiece
  };
};

// Calculate footer totals
const calculateFooterTotals = (products, flatDiscount, specialDiscountPercentage, freight) => {
  const grossTotal = products.reduce((sum, product) => sum + product.totalAmount, 0);
  const specialDiscountAmount = (grossTotal * specialDiscountPercentage) / 100;
  const grandTotal = grossTotal - flatDiscount - specialDiscountAmount - freight;
  
  return {
    grossTotal,
    specialDiscountAmount,
    grandTotal
  };
};

// Create inventory entry with payment integration (PIS approach)
exports.createInventory = async (inventoryData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Generate inventory ID
    const inventoryId = await generateInventoryId();
    
    // Validate brand exists
    const brand = await Brand.findById(inventoryData.brandId).session(session);
    if (!brand) {
      throw new Error("Brand not found");
    }
    
    // Process products
    const processedProducts = [];
    
    for (const productData of inventoryData.products) {
      // Validate product exists
      const product = await Product.findById(productData.productId).session(session);
      if (!product) {
        throw new Error(`Product not found: ${productData.productId}`);
      }
      
      // Calculate amounts for this product
      const calculations = calculateProductAmounts({
        ...productData,
        cartonSize: product.cartonSize
      });
      
      // Create processed product
      const processedProduct = {
        ...productData,
        productName: product.name,
        cartonSize: product.cartonSize,
        ...calculations
      };
      
      processedProducts.push(processedProduct);
    }
    
    // Calculate footer totals
    const footerTotals = calculateFooterTotals(
      processedProducts,
      inventoryData.flatDiscount || 0,
      inventoryData.specialDiscountPercentage || 0,
      inventoryData.freight || 0
    );
    
    // Create inventory entry
    const inventory = new Inventory({
      inventoryId,
      date: inventoryData.date || new Date(),
      brandId: inventoryData.brandId,
      brandName: brand.name,
      brandInvoice: inventoryData.brandInvoice,
      brandInvoiceDate: inventoryData.brandInvoiceDate,
      products: processedProducts,
      flatDiscount: inventoryData.flatDiscount || 0,
      specialDiscountPercentage: inventoryData.specialDiscountPercentage || 0,
      freight: inventoryData.freight || 0,
      remarksForInvoice: inventoryData.remarksForInvoice || "",
      // Payment fields
      cashPaid: inventoryData.cashPaid || 0,
      creditAmount: inventoryData.creditAmount || 0,
      paymentNotes: inventoryData.paymentNotes || "",
      paymentDate: inventoryData.paymentDate || new Date(),
      ...footerTotals
    });
    
    // Save the inventory
    const savedInventory = await newInventory.save({ session });
    
    // Check for low stock after inventory creation
    try {
      await this.checkLowStockForProducts(processedProducts);
    } catch (notificationError) {
      console.warn('Warning: Failed to send low stock notifications:', notificationError.message);
    }

    // Auto-create payable ledger entry
    const ledgerEntry = await ledgerService.createPayable({
      accountId: inventory.brandId,
      accountDetails: inventory.brandName,
      date: inventory.paymentDate,
      cash: inventory.cashPaid,
      credit: inventory.creditAmount,
      remarks: inventoryData.paymentNotes || `Auto-generated from Inventory ${inventory.inventoryId}`,
      sourceType: 'INVENTORY',
      sourceId: inventory._id
    });
    
    // Link ledger entry to inventory
    inventory.ledgerEntryId = ledgerEntry._id;
    await inventory.save({ session });
    
    await session.commitTransaction();
    return inventory;
    
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Failed to create inventory: ${error.message}`);
  } finally {
    session.endSession();
  }
};

// Get all inventories with pagination
exports.getAllInventories = async (page, limit, keyword, status = "active", brandId = "", startDate = "", endDate = "", companyId) => {
  try {
    // Build query with multi-tenant filtering
    const query = { 
      companyId: companyId, // Multi-tenant filtering
      isActive: status === "active" ? true : status === "inactive" ? false : { $in: [true, false] } 
    };
    
    if (keyword) {
      query.$or = [
        { inventoryId: { $regex: keyword, $options: "i" } },
        { brandName: { $regex: keyword, $options: "i" } },
        { brandInvoice: { $regex: keyword, $options: "i" } }
      ];
    }
    
    if (brandId) {
      query.brandId = brandId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Pagination options
    const paginationOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: [
        { path: "brandId", select: "name" },
        { path: "products.productId", select: "name" }
      ]
    };
    
    const result = await Inventory.paginate(query, paginationOptions);
    return result;
    
  } catch (error) {
    throw new Error(`Failed to get inventories: ${error.message}`);
  }
};

// Get inventory by ID
exports.getInventoryById = async (id) => {
  try {
    const inventory = await Inventory.findById(id)
      .populate("brandId", "name")
      .populate("products.productId", "name");
    
    if (!inventory || !inventory.isActive) {
      throw new Error("Inventory not found");
    }
    
    return inventory;
    
  } catch (error) {
    throw new Error(`Failed to get inventory: ${error.message}`);
  }
};

// Update inventory
exports.updateInventory = async (id, updateData) => {
  try {
    const inventory = await Inventory.findById(id);
    if (!inventory || !inventory.isActive) {
      throw new Error("Inventory not found");
    }
    
    // If products are being updated, recalculate everything
    if (updateData.products) {
      // Process products
      const processedProducts = [];
      
      for (const productData of updateData.products) {
        const product = await Product.findById(productData.productId);
        if (!product) {
          throw new Error(`Product not found: ${productData.productId}`);
        }
        
        const calculations = calculateProductAmounts({
          ...productData,
          cartonSize: product.cartonSize
        });
        
        const processedProduct = {
          ...productData,
          productName: product.name,
          cartonSize: product.cartonSize,
          ...calculations
        };
        
        processedProducts.push(processedProduct);
      }
      
      updateData.products = processedProducts;
      
      // Recalculate footer totals
      const footerTotals = calculateFooterTotals(
        processedProducts,
        updateData.flatDiscount || inventory.flatDiscount,
        updateData.specialDiscountPercentage || inventory.specialDiscountPercentage,
        updateData.freight || inventory.freight
      );
      
      Object.assign(updateData, footerTotals);
    }
    
    // Update brand name if brand ID changed
    if (updateData.brandId && updateData.brandId !== inventory.brandId.toString()) {
      const brand = await Brand.findById(updateData.brandId);
      if (!brand) {
        throw new Error("Brand not found");
      }
      updateData.brandName = brand.name;
    }
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("brandId", "name")
      .populate("products.productId", "name");
    
    return updatedInventory;
    
  } catch (error) {
    throw new Error(`Failed to update inventory: ${error.message}`);
  }
};

// Update payment for existing inventory
exports.updateInventoryPayment = async (id, paymentData, userId = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const inventory = await Inventory.findById(id).session(session);
    if (!inventory || !inventory.isActive) {
      throw new Error("Inventory not found");
    }
    
    // Update payment fields
    inventory.cashPaid = paymentData.cashPaid || 0;
    inventory.creditAmount = paymentData.creditAmount || 0;
    inventory.paymentNotes = paymentData.paymentNotes || inventory.paymentNotes;
    inventory.paymentDate = paymentData.paymentDate || inventory.paymentDate;
    
    await inventory.save({ session });
    
    // Update linked ledger entry
    if (inventory.ledgerEntryId) {
      await ledgerService.updateLedgerEntry(inventory.ledgerEntryId, {
        cash: inventory.cashPaid,
        credit: inventory.creditAmount,
        remarks: paymentData.paymentNotes || inventory.paymentNotes,
        date: inventory.paymentDate
      }, userId);
    }
    
    await session.commitTransaction();
    return inventory;
    
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Failed to update payment: ${error.message}`);
  } finally {
    session.endSession();
  }
};

// Delete inventory (soft delete)
exports.deleteInventory = async (id) => {
  try {
    const inventory = await Inventory.findById(id);
    if (!inventory || !inventory.isActive) {
      throw new Error("Inventory not found");
    }
    
    inventory.isActive = false;
    await inventory.save();
    
    // Also deactivate linked ledger entry
    if (inventory.ledgerEntryId) {
      await ledgerService.deleteLedgerEntry(inventory.ledgerEntryId);
    }
    
    return { message: "Inventory deleted successfully" };
    
  } catch (error) {
    throw new Error(`Failed to delete inventory: ${error.message}`);
  }
};

// Get inventory summary/statistics
exports.getInventoryStats = async () => {
  try {
    const stats = await Inventory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
          averageValue: { $avg: "$grandTotal" },
          totalProducts: { $sum: { $size: "$products" } }
        }
      }
    ]);
    
    return stats[0] || {
      totalEntries: 0,
      totalValue: 0,
      averageValue: 0,
      totalProducts: 0
    };
    
  } catch (error) {
    throw new Error(`Failed to get inventory stats: ${error.message}`);
  }
};

// Check and notify low stock items
exports.checkLowStock = async () => {
  try {
    // Get all active inventories
    const inventories = await Inventory.find({ isActive: true })
      .populate("products.productId", "name stockAlertLevel")
      .lean();
    
    // Get current settings
    const settings = await settingsService.getSettings();
    
    for (const inventory of inventories) {
      for (const product of inventory.products) {
        if (product.productId && product.stockAlertLevel) {
          // Check if stock is below alert level
          if (product.productId.stock <= product.stockAlertLevel) {
            // Send notification
            await notificationService.sendLowStockNotification({
              productId: product.productId._id,
              productName: product.productId.name,
              currentStock: product.productId.stock,
              alertLevel: product.stockAlertLevel,
              inventoryId: inventory._id,
              inventoryDate: inventory.date
            });
          }
        }
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to check low stock: ${error.message}`);
  }
};

// Helper function to check low stock for specific products
exports.checkLowStockForProducts = async (products) => {
  try {
    const settings = await settingsService.getSettings();
    
    if (!settings.notifications.lowStock.enabled) {
      return; // Notifications disabled
    }

    const lowStockThreshold = settings.inventory.lowStockThreshold;
    
    for (const product of products) {
      if (product.totalQuantity <= lowStockThreshold) {
        await notificationService.sendLowStockNotification({
          productName: product.productName,
          batchNumber: product.batchNumber,
          currentStock: product.totalQuantity,
          threshold: lowStockThreshold,
          expiry: product.expiry
        });
      }
    }
  } catch (error) {
    console.error('Failed to check low stock for products:', error.message);
  }
};


