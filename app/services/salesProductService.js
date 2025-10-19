const SalesProduct = require('../models/salesProductModel');
const SalesInvoice = require('../models/salesInvoiceModel');
const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

exports.getAllSalesProducts = async (page, limit, keyword, status, vendorId, productId, salesInvoiceId, batchNumber) => {
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
    
    // Filter by sales invoice if provided
    if (salesInvoiceId && salesInvoiceId !== "") {
      query.salesInvoiceId = salesInvoiceId;
    }
    
    // Filter by batch number if provided
    if (batchNumber && batchNumber !== "") {
      query.batchNumber = { $regex: batchNumber, $options: 'i' };
    }
    
    // Search by keyword in product name or batch number
    if (keyword && keyword !== "") {
      query.$or = [
        { productName: { $regex: keyword, $options: 'i' } },
        { batchNumber: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await SalesProduct.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'productId',
          select: 'productName packingSize cartonSize'
        },
        {
          path: 'salesInvoiceId',
          select: 'deliveryLogNumber date customerId',
          populate: {
            path: 'customerId',
            select: 'customerName'
          }
        },
        {
          path: 'inventoryId',
          select: 'currentQuantity reservedQuantity'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllSalesProducts:', error);
    throw error;
  }
};

exports.getSalesProductById = async (id, vendorId) => {
  try {
    const salesProduct = await SalesProduct.findOne({ _id: id, vendorId })
      .populate('productId', 'productName packingSize cartonSize')
      .populate({
        path: 'salesInvoiceId',
        select: 'deliveryLogNumber date customerId deliverBy bookedBy',
        populate: [
          { path: 'customerId', select: 'customerName customerAddress' },
          { path: 'deliverBy', select: 'employeeName' },
          { path: 'bookedBy', select: 'employeeName' }
        ]
      })
      .populate('inventoryId', 'currentQuantity reservedQuantity averageCost');
      
    if (!salesProduct) {
      throw new Error('Sales product not found');
    }

    return salesProduct;
  } catch (error) {
    throw error;
  }
};

exports.getSalesProductsBySalesInvoice = async (salesInvoiceId, vendorId) => {
  try {
    return await SalesProduct.find({ salesInvoiceId, vendorId })
      .populate('productId', 'productName packingSize cartonSize')
      .populate('inventoryId', 'currentQuantity reservedQuantity averageCost')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error in getSalesProductsBySalesInvoice:', error);
    throw error;
  }
};

exports.getSalesProductsByProduct = async (productId, vendorId, options = {}) => {
  try {
    let query = { productId, vendorId };
    
    if (options.isActive !== undefined) {
      query.isActive = options.isActive;
    }
    
    if (options.batchNumber) {
      query.batchNumber = options.batchNumber;
    }
    
    if (options.expiryBefore) {
      query.expiry = { ...query.expiry, $lte: options.expiryBefore };
    }
    
    if (options.expiryAfter) {
      query.expiry = { ...query.expiry, $gte: options.expiryAfter };
    }
    
    if (options.startDate && options.endDate) {
      query.createdAt = { $gte: options.startDate, $lte: options.endDate };
    }

    return await SalesProduct.find(query)
      .populate('productId', 'productName packingSize cartonSize')
      .populate({
        path: 'salesInvoiceId',
        select: 'deliveryLogNumber date customerId',
        populate: { path: 'customerId', select: 'customerName' }
      })
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error in getSalesProductsByProduct:', error);
    throw error;
  }
};

exports.getExpiringSalesProducts = async (vendorId, daysFromNow = 30) => {
  try {
    return await SalesProduct.getExpiringSalesProducts(vendorId, daysFromNow);
  } catch (error) {
    console.error('Error in getExpiringSalesProducts:', error);
    throw error;
  }
};

exports.getProductSalesHistory = async (productId, vendorId, options = {}) => {
  try {
    return await SalesProduct.getSalesByProduct(productId, vendorId, options);
  } catch (error) {
    console.error('Error in getProductSalesHistory:', error);
    throw error;
  }
};

exports.getBatchSalesHistory = async (productId, vendorId, batchNumber) => {
  try {
    return await SalesProduct.getBatchSalesHistory(productId, vendorId, batchNumber);
  } catch (error) {
    console.error('Error in getBatchSalesHistory:', error);
    throw error;
  }
};

exports.updateSalesProduct = async (vendorId, salesProductId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingSalesProduct = await SalesProduct.findOne({
      _id: salesProductId,
      vendorId: vendorId
    }).session(session);

    if (!existingSalesProduct) {
      throw new Error('Sales product not found');
    }

    // Reverse the old inventory change
    await Inventory.findByIdAndUpdate(
      existingSalesProduct.inventoryId,
      {
        $inc: { currentQuantity: existingSalesProduct.quantity },
        lastUpdated: new Date()
      },
      { session }
    );

    // If quantity is being updated, validate new inventory requirements
    if (updateData.quantity !== undefined) {
      const inventoryItem = await Inventory.findById(existingSalesProduct.inventoryId).session(session);
      
      if (!inventoryItem) {
        throw new Error('Inventory item not found');
      }

      // Check if new quantity is available (including the returned quantity)
      const availableQuantity = inventoryItem.currentQuantity + existingSalesProduct.quantity;
      if (updateData.quantity > availableQuantity) {
        throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Required: ${updateData.quantity}`);
      }

      // Validate pricing if price is being updated
      if (updateData.price !== undefined && !updateData.lessToMinimumCheck && updateData.price < inventoryItem.minSalePrice) {
        throw new Error(`Cannot sell below minimum price of ${inventoryItem.minSalePrice}`);
      }

      // Apply the new inventory change
      await Inventory.findByIdAndUpdate(
        existingSalesProduct.inventoryId,
        {
          $inc: { currentQuantity: -updateData.quantity },
          lastUpdated: new Date()
        },
        { session }
      );
    } else {
      // If quantity not updated, apply the same quantity back
      await Inventory.findByIdAndUpdate(
        existingSalesProduct.inventoryId,
        {
          $inc: { currentQuantity: -existingSalesProduct.quantity },
          lastUpdated: new Date()
        },
        { session }
      );
    }

    // Update the sales product
    const updatedSalesProduct = await SalesProduct.findByIdAndUpdate(
      salesProductId,
      updateData,
      { new: true, session }
    );

    // Update the parent sales invoice totals if financial data changed
    if (updateData.quantity !== undefined || updateData.price !== undefined || 
        updateData.percentageDiscount !== undefined || updateData.flatDiscount !== undefined) {
      
      // Recalculate sales invoice totals
      const allSalesProducts = await SalesProduct.find({ 
        salesInvoiceId: existingSalesProduct.salesInvoiceId,
        vendorId: vendorId 
      }).session(session);

      let newSubtotal = 0;
      let newTotalDiscount = 0;

      allSalesProducts.forEach(sp => {
        if (sp._id.toString() === salesProductId) {
          // Use updated values
          const grossAmount = (updateData.quantity || sp.quantity) * (updateData.price || sp.price);
          const percentageDiscountAmount = (grossAmount * ((updateData.percentageDiscount !== undefined ? updateData.percentageDiscount : sp.percentageDiscount) || 0)) / 100;
          const totalDiscountAmount = percentageDiscountAmount + ((updateData.flatDiscount !== undefined ? updateData.flatDiscount : sp.flatDiscount) || 0);
          const netAmount = grossAmount - totalDiscountAmount;
          newSubtotal += netAmount;
          newTotalDiscount += totalDiscountAmount;
        } else {
          // Use existing values
          newSubtotal += sp.totalAmount;
          const grossAmount = sp.quantity * sp.price;
          const percentageDiscountAmount = (grossAmount * sp.percentageDiscount) / 100;
          const totalDiscountAmount = percentageDiscountAmount + sp.flatDiscount;
          newTotalDiscount += totalDiscountAmount;
        }
      });

      // Update sales invoice
      await SalesInvoice.findByIdAndUpdate(
        existingSalesProduct.salesInvoiceId,
        {
          subtotal: newSubtotal,
          totalDiscount: newTotalDiscount,
          grandTotal: newSubtotal
        },
        { session }
      );
    }

    await session.commitTransaction();
    return updatedSalesProduct;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in updateSalesProduct:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.deleteSalesProduct = async (vendorId, salesProductId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const salesProduct = await SalesProduct.findOne({
      _id: salesProductId,
      vendorId: vendorId
    }).session(session);

    if (!salesProduct) {
      throw new Error('Sales product not found');
    }

    // Reverse inventory change
    await Inventory.findByIdAndUpdate(
      salesProduct.inventoryId,
      {
        $inc: { currentQuantity: salesProduct.quantity },
        lastUpdated: new Date()
      },
      { session }
    );

    // Get all other sales products for the same invoice
    const remainingSalesProducts = await SalesProduct.find({
      salesInvoiceId: salesProduct.salesInvoiceId,
      vendorId: vendorId,
      _id: { $ne: salesProductId }
    }).session(session);

    // Recalculate sales invoice totals
    let newSubtotal = 0;
    let newTotalDiscount = 0;

    remainingSalesProducts.forEach(sp => {
      newSubtotal += sp.totalAmount;
      const grossAmount = sp.quantity * sp.price;
      const percentageDiscountAmount = (grossAmount * sp.percentageDiscount) / 100;
      const totalDiscountAmount = percentageDiscountAmount + sp.flatDiscount;
      newTotalDiscount += totalDiscountAmount;
    });

    // Update sales invoice
    await SalesInvoice.findByIdAndUpdate(
      salesProduct.salesInvoiceId,
      {
        subtotal: newSubtotal,
        totalDiscount: newTotalDiscount,
        grandTotal: newSubtotal
      },
      { session }
    );

    // Delete the sales product
    await SalesProduct.findByIdAndDelete(salesProductId, { session });

    await session.commitTransaction();
    return { message: 'Sales product deleted and inventory restored successfully' };
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in deleteSalesProduct:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.toggleSalesProductStatus = async (vendorId, salesProductId) => {
  try {
    const salesProduct = await SalesProduct.findOne({
      _id: salesProductId,
      vendorId: vendorId
    });

    if (!salesProduct) {
      throw new Error('Sales product not found');
    }

    salesProduct.isActive = !salesProduct.isActive;
    await salesProduct.save();

    return salesProduct;
  } catch (error) {
    console.error('Error in toggleSalesProductStatus:', error);
    throw error;
  }
};

exports.getSalesProductsByBatch = async (batchNumber, vendorId, options = {}) => {
  try {
    return await SalesProduct.getSalesByBatch(batchNumber, vendorId, options);
  } catch (error) {
    console.error('Error in getSalesProductsByBatch:', error);
    throw error;
  }
};

exports.getInventoryAvailableForSale = async (vendorId, productId = null) => {
  try {
    let query = { 
      vendorId, 
      currentQuantity: { $gt: 0 }, 
      isActive: true 
    };
    
    if (productId) {
      query.productId = productId;
    }

    return await Inventory.find(query)
      .populate('productId', 'productName packingSize cartonSize')
      .populate('brandId', 'brandName')
      .sort({ expiryDate: 1 }); // FIFO - First Expiry First Out
  } catch (error) {
    console.error('Error in getInventoryAvailableForSale:', error);
    throw error;
  }
};

exports.getSalesAnalytics = async (vendorId, options = {}) => {
  try {
    let matchQuery = { vendorId: new mongoose.Types.ObjectId(vendorId) };
    
    if (options.startDate && options.endDate) {
      matchQuery.createdAt = { 
        $gte: new Date(options.startDate), 
        $lte: new Date(options.endDate) 
      };
    }
    
    if (options.productId) {
      matchQuery.productId = new mongoose.Types.ObjectId(options.productId);
    }

    const analytics = await SalesProduct.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantitySold: { $sum: "$quantity" },
          totalBonusGiven: { $sum: "$bonus" },
          totalSalesAmount: { $sum: "$totalAmount" },
          totalDiscountGiven: { $sum: { $add: [
            { $multiply: [
              { $multiply: ["$quantity", "$price"] },
              { $divide: ["$percentageDiscount", 100] }
            ]},
            "$flatDiscount"
          ]}},
          averageSalePrice: { $avg: "$price" },
          averageDiscount: { $avg: { $add: [
            { $multiply: [
              { $multiply: ["$quantity", "$price"] },
              { $divide: ["$percentageDiscount", 100] }
            ]},
            "$flatDiscount"
          ]}}
        }
      }
    ]);

    return analytics.length > 0 ? analytics[0] : {
      totalProducts: 0,
      totalQuantitySold: 0,
      totalBonusGiven: 0,
      totalSalesAmount: 0,
      totalDiscountGiven: 0,
      averageSalePrice: 0,
      averageDiscount: 0
    };
  } catch (error) {
    console.error('Error in getSalesAnalytics:', error);
    throw error;
  }
};
