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
      effectiveCostPerPiece: product.effectiveCostPerPiece
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
  try {
    const purchaseEntry = await PurchaseEntry.findOne({ _id: purchaseEntryId, vendorId });
    if (!purchaseEntry) {
      throw new Error('Purchase entry not found');
    }

    // Check for duplicate invoice number if it's being updated
    if (updateData.invoiceNumber && updateData.invoiceNumber !== purchaseEntry.invoiceNumber) {
      const existingEntry = await PurchaseEntry.findOne({
        vendorId,
        invoiceNumber: updateData.invoiceNumber,
        _id: { $ne: purchaseEntryId }
      });

      if (existingEntry) {
        throw new Error(`Purchase entry with invoice number "${updateData.invoiceNumber}" already exists`);
      }
    }

    // Validate brand if it's being updated
    if (updateData.brandId) {
      const Brand = require('../models/brandModel');
      const brand = await Brand.findById(updateData.brandId);
      if (!brand) {
        throw new Error('Brand not found');
      }
    }

    Object.assign(purchaseEntry, updateData);
    const updatedPurchaseEntry = await purchaseEntry.save();
    
    // Return the populated purchase entry
    return await PurchaseEntry.findById(updatedPurchaseEntry._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    throw error;
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
        // Decrease inventory quantity
        inventory.currentQuantity -= (purchaseProduct.quantity + purchaseProduct.bonus);
        
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

exports.createPurchaseProducts = async (purchaseEntryId, products, vendorId, session = null) => {
  try {
    const purchaseProducts = [];
    
    for (const productData of products) {
      // Validate product exists
      const product = await Product.findById(productData.productId);
      if (!product) {
        throw new Error(`Product with ID ${productData.productId} not found`);
      }
      
      // Check if batch already exists for this product and vendor
      const existingBatch = await PurchaseProduct.findOne({
        productId: productData.productId,
        vendorId,
        batchNumber: productData.batchNumber
      });
      
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

exports.updateInventoryForPurchase = async (purchaseProduct, session = null) => {
  try {
    const inventoryData = {
      vendorId: purchaseProduct.vendorId,
      productId: purchaseProduct.productId,
      batchNumber: purchaseProduct.batchNumber,
      expiryDate: purchaseProduct.expiryDate,
      currentQuantity: purchaseProduct.quantity + purchaseProduct.bonus,
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
