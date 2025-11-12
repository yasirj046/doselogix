const PurchaseEntry = require('../models/purchaseEntryModel');
const PurchaseProduct = require('../models/purchaseProductModel');
const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const mongoose = require('mongoose');

exports.getAllPurchaseEntries = async (page, limit, keyword, status, vendorId, brandId, startDate, endDate, paymentStatus) => {
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
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // Search by keyword in invoice number or remarks
    if (keyword && keyword !== "") {
      query.$or = [
        { invoiceNumber: { $regex: keyword, $options: 'i' } },
        { remarks: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filter by payment status if provided
    if (paymentStatus && paymentStatus !== "") {
      switch (paymentStatus.toLowerCase()) {
        case 'paid':
          // Total paid (cash + credit payments) is greater than or equal to grand total
          // OR remaining credit is zero or less
          query.$expr = {
            $or: [
              { $gte: [{ $add: [{ $ifNull: ["$cashPaid", 0] }, { $sum: { $map: { input: { $ifNull: ["$paymentDetails", []] }, as: "payment", in: { $ifNull: ["$$payment.amountPaid", 0] } } } }] }, { $ifNull: ["$grandTotal", 0] }] },
              { $lte: [{ $subtract: [{ $ifNull: ["$creditAmount", 0] }, { $sum: { $map: { input: { $ifNull: ["$paymentDetails", []] }, as: "payment", in: { $ifNull: ["$$payment.amountPaid", 0] } } } }] }, 0] }
            ]
          };
          break;
        case 'unpaid':
          // No cash paid and no credit payments made
          query.$expr = {
            $and: [
              { $lte: [{ $ifNull: ["$cashPaid", 0] }, 0] },
              { $lte: [{ $sum: { $map: { input: { $ifNull: ["$paymentDetails", []] }, as: "payment", in: { $ifNull: ["$$payment.amountPaid", 0] } } } }, 0] }
            ]
          };
          break;
        case 'partial':
          // Some payment made (cash or credit payments) but not fully paid
          // AND remaining credit is greater than zero
          query.$expr = {
            $and: [
              { $gt: [{ $add: [{ $ifNull: ["$cashPaid", 0] }, { $sum: { $map: { input: { $ifNull: ["$paymentDetails", []] }, as: "payment", in: { $ifNull: ["$$payment.amountPaid", 0] } } } }] }, 0] },
              { $lt: [{ $add: [{ $ifNull: ["$cashPaid", 0] }, { $sum: { $map: { input: { $ifNull: ["$paymentDetails", []] }, as: "payment", in: { $ifNull: ["$$payment.amountPaid", 0] } } } }] }, { $ifNull: ["$grandTotal", 0] }] },
              { $gt: [{ $subtract: [{ $ifNull: ["$creditAmount", 0] }, { $sum: { $map: { input: { $ifNull: ["$paymentDetails", []] }, as: "payment", in: { $ifNull: ["$$payment.amountPaid", 0] } } } }] }, 0] }
            ]
          };
          break;
      }
    }

    return await PurchaseEntry.paginate(query, { 
      page, 
      limit,
      sort: { date: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        },
        {
          path: 'brandId',
          select: 'brandName'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllPurchaseEntries:', error);
    throw error;
  }
};

exports.getPurchaseEntryById = async (id, vendorId) => {
  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
      
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    // Get the associated purchase products
    const purchaseProducts = await PurchaseProduct.find({ 
      purchaseEntryId: id, 
      vendorId: vendorId 
    }).populate('productId', 'productName cartonSize packingSize');

    // Convert to plain object and add products
    const purchaseEntryWithProducts = purchaseEntry.toObject();
    purchaseEntryWithProducts.products = purchaseProducts.map(product => ({
      productId: product.productId._id,
      productName: product.productId.productName,
      cartonSize: product.productId.cartonSize,
      packingSize: product.productId.packingSize,
      batchNumber: product.batchNumber,
      expiryDate: product.expiryDate,
      cartons: product.cartons,
      pieces: product.pieces,
      bonus: product.bonus,
      netPrice: product.netPrice,
      discount: product.discount,
      discountType: product.discountType,
      salePrice: product.salePrice,
      minSalePrice: product.minSalePrice,
      retailPrice: product.retailPrice,
      invoicePrice: product.invoicePrice,
      quantity: product.quantity,
      totalAmount: product.totalAmount,
      effectiveCostPerPiece: product.effectiveCostPerPiece,
      returnQuantity: product.returnQuantity || 0,
      returnDate: product.returnDate || null
    }));

    return purchaseEntryWithProducts;
  } catch (error) {
    throw error;
  }
};

exports.createPurchaseEntry = async (purchaseEntryData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if invoice number already exists for this vendor
    const existingEntry = await PurchaseEntry.findOne({
      vendorId: purchaseEntryData.vendorId,
      invoiceNumber: purchaseEntryData.invoiceNumber
    }).session(session);

    if (existingEntry) {
      throw new Error(`Purchase entry with invoice number "${purchaseEntryData.invoiceNumber}" already exists`);
    }

    // Validate that brand exists
    const brand = await Brand.findById(purchaseEntryData.brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Create purchase entry
    const purchaseEntry = new PurchaseEntry(purchaseEntryData);
    const savedPurchaseEntry = await purchaseEntry.save({ session });

    // If products are provided, create them and update inventory
    if (purchaseEntryData.products && purchaseEntryData.products.length > 0) {
      await this.createPurchaseProducts(savedPurchaseEntry._id, purchaseEntryData.products, purchaseEntryData.vendorId, session);
    }

    await session.commitTransaction();

    // Return the populated purchase entry
    return await PurchaseEntry.findById(savedPurchaseEntry._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating purchase entry:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.updatePurchaseEntry = async (vendorId, purchaseEntryId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: purchaseEntryId, vendorId }).session(session);
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    // Check for duplicate invoice number if it's being updated
    if (updateData.invoiceNumber && updateData.invoiceNumber !== purchaseEntry.invoiceNumber) {
      const existingEntry = await PurchaseEntry.findOne({
        vendorId,
        invoiceNumber: updateData.invoiceNumber,
        _id: { $ne: purchaseEntryId }
      }).session(session);

      if (existingEntry) {
        throw new Error(`Purchase entry with invoice number "${updateData.invoiceNumber}" already exists`);
      }
    }

    // Validate brand if it's being updated
    if (updateData.brandId) {
      const Brand = require('../models/brandModel');
      const brand = await Brand.findById(updateData.brandId).session(session);
      if (!brand) {
        throw new Error('Brand not found');
      }
    }

    // Extract products from updateData before updating purchase entry
    const products = updateData.products;
    const purchaseEntryUpdateData = { ...updateData };
    delete purchaseEntryUpdateData.products;

    // Update purchase entry fields
    Object.assign(purchaseEntry, purchaseEntryUpdateData);
    const updatedPurchaseEntry = await purchaseEntry.save({ session });

    // Handle products update if provided
    if (products && Array.isArray(products)) {
      // Delete existing purchase products and reverse inventory changes
      const existingProducts = await PurchaseProduct.find({ 
        purchaseEntryId, 
        vendorId 
      }).session(session);

      // Reverse inventory changes for existing products
      for (const existingProduct of existingProducts) {
        const inventory = await Inventory.findOne({
          productId: existingProduct.productId,
          vendorId,
          batchNumber: existingProduct.batchNumber
        }).session(session);

        if (inventory) {
          // Calculate effective quantity that was added (considering any previous returns)
          const effectiveQuantity = existingProduct.quantity - (existingProduct.returnQuantity || 0);
          
          // Decrease inventory quantities by the effective amount
          inventory.currentQuantity = Math.max(0, inventory.currentQuantity - effectiveQuantity - existingProduct.bonus);
          
          // If quantity becomes 0, mark as inactive
          if (inventory.currentQuantity === 0) {
            inventory.isActive = false;
          }
          
          await inventory.save({ session });
        }
      }

      // Delete existing purchase products
      await PurchaseProduct.deleteMany({ 
        purchaseEntryId, 
        vendorId 
      }).session(session);

      // Create new purchase products
      if (products.length > 0) {
        await this.createPurchaseProducts(purchaseEntryId, products, vendorId, session, purchaseEntryId);
      }
    }

    await session.commitTransaction();
    
    // Return the populated purchase entry with products
    const result = await this.getPurchaseEntryById(purchaseEntryId, vendorId);
    return result;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating purchase entry:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.deletePurchaseEntry = async (vendorId, purchaseEntryId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: purchaseEntryId, vendorId }).session(session);
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    // Get all purchase products for this entry
    const purchaseProducts = await PurchaseProduct.find({ purchaseEntryId, vendorId }).session(session);

    // Reverse inventory changes for each product
    for (const purchaseProduct of purchaseProducts) {
      const inventory = await Inventory.findOne({
        productId: purchaseProduct.productId,
        vendorId,
        batchNumber: purchaseProduct.batchNumber
      }).session(session);

      if (inventory) {
        // Calculate effective quantity that was added (considering returns)
        const effectiveQuantity = purchaseProduct.quantity - (purchaseProduct.returnQuantity || 0);
        
        // Decrease inventory quantity by effective amount
        inventory.currentQuantity -= (effectiveQuantity + purchaseProduct.bonus);
        
        // Ensure quantity doesn't go negative
        if (inventory.currentQuantity < 0) {
          inventory.currentQuantity = 0;
        }
        
        await inventory.save({ session });
      }
    }

    // Delete purchase products
    await PurchaseProduct.deleteMany({ purchaseEntryId, vendorId }).session(session);

    // Delete purchase entry
    await PurchaseEntry.findByIdAndDelete(purchaseEntryId).session(session);

    await session.commitTransaction();
    return { message: 'Purchase entry and associated products deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

exports.togglePurchaseEntryStatus = async (vendorId, purchaseEntryId) => {
  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: purchaseEntryId, vendorId });
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    purchaseEntry.isActive = !purchaseEntry.isActive;
    const updatedPurchaseEntry = await purchaseEntry.save();
    
    // Return the populated purchase entry
    return await PurchaseEntry.findById(updatedPurchaseEntry._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    throw error;
  }
};

exports.getPurchaseEntriesByDateRange = async (vendorId, startDate, endDate, options = {}) => {
  try {
    const query = { 
      vendorId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };
    
    if (typeof options.isActive === 'boolean') {
      query.isActive = options.isActive;
    }
    
    if (options.brandId) {
      query.brandId = options.brandId;
    }
    
    return await PurchaseEntry.find(query)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .sort({ date: -1 });
  } catch (error) {
    throw error;
  }
};

exports.getPurchaseStats = async (vendorId, options = {}) => {
  try {
    return await PurchaseEntry.getPurchaseStats(vendorId, options);
  } catch (error) {
    throw error;
  }
};

exports.createPurchaseProducts = async (purchaseEntryId, products, vendorId, session = null, excludePurchaseEntryId = null) => {
  try {
    const purchaseProducts = [];
    
    for (const productData of products) {
      // Validate product exists
      const product = await Product.findById(productData.productId);
      if (!product) {
        throw new Error(`Product with ID ${productData.productId} not found`);
      }
      
      // Check if batch already exists for this product and vendor
      // Exclude the current purchase entry being updated to avoid false positives
      const batchQuery = {
        productId: productData.productId,
        vendorId,
        batchNumber: productData.batchNumber
      };
      
      // If we're updating, exclude the current purchase entry from the check
      if (excludePurchaseEntryId) {
        batchQuery.purchaseEntryId = { $ne: excludePurchaseEntryId };
      }
      
      const existingBatch = await PurchaseProduct.findOne(batchQuery);
      
      if (existingBatch) {
        throw new Error(`Batch number "${productData.batchNumber}" already exists for this product`);
      }
      
      // Create purchase product
      const purchaseProductData = {
        purchaseEntryId,
        productId: productData.productId,
        vendorId,
        ...productData
      };
      
      const purchaseProduct = new PurchaseProduct(purchaseProductData);
      const savedPurchaseProduct = session 
        ? await purchaseProduct.save({ session })
        : await purchaseProduct.save();
      
      purchaseProducts.push(savedPurchaseProduct);
      
      // Update inventory
      await this.updateInventoryForPurchase(savedPurchaseProduct, session);
    }
    
    return purchaseProducts;
  } catch (error) {
    throw error;
  }
};

exports.addPaymentToCredit = async (vendorId, purchaseEntryId, paymentData) => {
  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: purchaseEntryId, vendorId });
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    const currentCreditPayments = purchaseEntry.paymentDetails.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const remainingCredit = purchaseEntry.creditAmount - currentCreditPayments;

    if (paymentData.amountPaid > remainingCredit) {
      throw new Error(`Payment amount (₨${paymentData.amountPaid}) cannot exceed remaining credit (₨${remainingCredit})`);
    }

    // Add the new payment to paymentDetails array
    purchaseEntry.paymentDetails.push({
      date: paymentData.date || new Date(),
      amountPaid: paymentData.amountPaid
    });

    const updatedPurchaseEntry = await purchaseEntry.save();
    
    // Return the populated purchase entry
    return await PurchaseEntry.findById(updatedPurchaseEntry._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    throw error;
  }
};

exports.removePaymentFromCredit = async (vendorId, purchaseEntryId, paymentIndex) => {
  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: purchaseEntryId, vendorId });
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    if (paymentIndex < 0 || paymentIndex >= purchaseEntry.paymentDetails.length) {
      throw new Error('Invalid payment index');
    }

    // Remove the payment at the specified index
    purchaseEntry.paymentDetails.splice(paymentIndex, 1);

    const updatedPurchaseEntry = await purchaseEntry.save();
    
    // Return the populated purchase entry
    return await PurchaseEntry.findById(updatedPurchaseEntry._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    throw error;
  }
};

exports.updateInventoryForPurchase = async (purchaseProduct, session = null) => {
  try {
    // Get the purchase entry to obtain brandId
    const purchaseEntry = await PurchaseEntry.findById(purchaseProduct.purchaseEntryId)
      .select('brandId')
      .session(session);
    
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    // Calculate effective quantity after returns
    const effectiveQuantity = purchaseProduct.quantity - (purchaseProduct.returnQuantity || 0);
    
    const inventoryData = {
      vendorId: purchaseProduct.vendorId,
      productId: purchaseProduct.productId,
      brandId: purchaseEntry.brandId, // Include brandId from purchase entry
      batchNumber: purchaseProduct.batchNumber,
      expiryDate: purchaseProduct.expiryDate,
      currentQuantity: effectiveQuantity + purchaseProduct.bonus,
      lastPurchasePrice: purchaseProduct.effectiveCostPerPiece,
      averageCost: purchaseProduct.effectiveCostPerPiece,
      salePrice: purchaseProduct.salePrice,
      minSalePrice: purchaseProduct.minSalePrice,
      retailPrice: purchaseProduct.retailPrice,
      invoicePrice: purchaseProduct.invoicePrice,
      isActive: true
    };
    
    const inventory = session
      ? await Inventory.findOneAndUpdate(
          {
            vendorId: purchaseProduct.vendorId,
            productId: purchaseProduct.productId,
            batchNumber: purchaseProduct.batchNumber
          },
          inventoryData,
          { upsert: true, new: true, session }
        )
      : await Inventory.findOneAndUpdate(
          {
            vendorId: purchaseProduct.vendorId,
            productId: purchaseProduct.productId,
            batchNumber: purchaseProduct.batchNumber
          },
          inventoryData,
          { upsert: true, new: true }
        );
    
    return inventory;
  } catch (error) {
    throw error;
  }
};

exports.getLastInvoiceByBrand = async (vendorId, brandId) => {
  try {
    // Find the most recent purchase entry for the given vendor and brand
    const lastInvoice = await PurchaseEntry.findOne({ 
      vendorId, 
      brandId, 
      isActive: true 
    })
    .sort({ updatedAt: -1 }) // Sort by updatedAt in descending order
    .populate('brandId', 'brandName')
    .select('invoiceNumber grandTotal date createdAt');

    if (!lastInvoice) {
      return {
        lastInvoiceNumber: null,
        lastInvoicePrice: null,
        message: 'No Record'
      };
    }

    return {
      lastInvoiceNumber: lastInvoice.invoiceNumber,
      lastInvoicePrice: lastInvoice.grandTotal,
      lastInvoiceDate: lastInvoice.date,
      message: 'Last invoice found'
    };
  } catch (error) {
    throw error;
  }
};
