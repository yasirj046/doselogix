const SalesInvoice = require('../models/salesInvoiceModel');
const SalesProduct = require('../models/salesProductModel');
const Inventory = require('../models/inventoryModel');
const UserCustomers = require('../models/userCustomersModel');
const Employee = require('../models/employeeModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

exports.getAllSalesInvoices = async (page, limit, keyword, status, vendorId, customerId, startDate, endDate, paymentStatus, employeeId) => {
  try {
    let query = { vendorId };
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Filter by customer if provided
    if (customerId && customerId !== "") {
      query.customerId = customerId;
    }
    
    // Filter by employee if provided (either deliver by or booked by)
    if (employeeId && employeeId !== "") {
      query.$or = [
        { deliverBy: employeeId },
        { bookedBy: employeeId }
      ];
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // Search by keyword in delivery log number or remarks
    if (keyword && keyword !== "") {
      query.$or = [
        { deliveryLogNumber: { $regex: keyword, $options: 'i' } },
        { remarks: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filter by payment status if provided
    if (paymentStatus && paymentStatus !== "") {
      switch (paymentStatus.toLowerCase()) {
        case 'paid':
          // Total paid (cash + credit payments) is greater than or equal to grand total
          query.$expr = {
            $gte: [
              { $add: [
                { $ifNull: ["$cash", 0] }, 
                { $sum: { $map: { 
                  input: { $ifNull: ["$paymentDetails", []] }, 
                  as: "payment", 
                  in: { $ifNull: ["$$payment.amountPaid", 0] } 
                }}}
              ]}, 
              { $ifNull: ["$grandTotal", 0] }
            ]
          };
          break;
        case 'unpaid':
          // No cash paid and no credit payments made
          query.$expr = {
            $and: [
              { $lte: [{ $ifNull: ["$cash", 0] }, 0] },
              { $lte: [{ $sum: { $map: { 
                input: { $ifNull: ["$paymentDetails", []] }, 
                as: "payment", 
                in: { $ifNull: ["$$payment.amountPaid", 0] } 
              }}}, 0] }
            ]
          };
          break;
        case 'partial':
          // Some payment made but not fully paid
          query.$expr = {
            $and: [
              { $gt: [
                { $add: [
                  { $ifNull: ["$cash", 0] }, 
                  { $sum: { $map: { 
                    input: { $ifNull: ["$paymentDetails", []] }, 
                    as: "payment", 
                    in: { $ifNull: ["$$payment.amountPaid", 0] } 
                  }}}
                ]}, 
                0
              ]},
              { $lt: [
                { $add: [
                  { $ifNull: ["$cash", 0] }, 
                  { $sum: { $map: { 
                    input: { $ifNull: ["$paymentDetails", []] }, 
                    as: "payment", 
                    in: { $ifNull: ["$$payment.amountPaid", 0] } 
                  }}}
                ]}, 
                { $ifNull: ["$grandTotal", 0] }
              ]}
            ]
          };
          break;
      }
    }

    return await SalesInvoice.paginate(query, { 
      page, 
      limit,
      sort: { date: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        },
        {
          path: 'customerId',
          select: 'customerName customerAddress customerCity customerArea customerSubArea',
          populate: [
            { path: 'customerArea', select: 'areaName' },
            { path: 'customerSubArea', select: 'subAreaName' }
          ]
        },
        {
          path: 'deliverBy',
          select: 'employeeName employeeDesignation'
        },
        {
          path: 'bookedBy',
          select: 'employeeName employeeDesignation'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllSalesInvoices:', error);
    throw error;
  }
};

exports.getSalesInvoiceById = async (id, vendorId) => {
  try {
    const salesInvoice = await SalesInvoice.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate({
        path: 'customerId',
        select: 'customerName customerAddress customerCity customerArea customerSubArea customerLicenseNumber customerLicenseExpiryDate',
        populate: [
          { path: 'customerArea', select: 'areaName' },
          { path: 'customerSubArea', select: 'subAreaName' }
        ]
      })
      .populate('deliverBy', 'employeeName employeeDesignation')
      .populate('bookedBy', 'employeeName employeeDesignation');
      
    if (!salesInvoice) {
      throw new Error('Sales invoice not found');
    }

    // Get the associated sales products
    const salesProducts = await SalesProduct.find({ 
      salesInvoiceId: id, 
      vendorId: vendorId 
    }).populate('productId', 'productName cartonSize packingSize')
      .populate('inventoryId', 'currentQuantity reservedQuantity');

    // Convert to plain object and add products
    const salesInvoiceWithProducts = salesInvoice.toObject();
    salesInvoiceWithProducts.products = salesProducts.map(product => ({
      productId: product.productId._id,
      productName: product.productName,
      cartonSize: product.productId.cartonSize,
      packingSize: product.productId.packingSize,
      batchNumber: product.batchNumber,
      expiry: product.expiry,
      availableStock: product.availableStock,
      quantity: product.quantity,
      bonus: product.bonus,
      totalQuantity: product.totalQuantity,
      lessToMinimumCheck: product.lessToMinimumCheck,
      price: product.price,
      percentageDiscount: product.percentageDiscount,
      flatDiscount: product.flatDiscount,
      effectiveCostPerPiece: product.effectiveCostPerPiece,
      totalAmount: product.totalAmount,
      originalSalePrice: product.originalSalePrice,
      minSalePrice: product.minSalePrice,
      inventoryId: product.inventoryId._id,
      currentInventoryStock: product.inventoryId.currentQuantity
    }));

    return salesInvoiceWithProducts;
  } catch (error) {
    throw error;
  }
};

exports.createSalesInvoice = async (salesInvoiceData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate customer exists
    const customer = await UserCustomers.findOne({
      _id: salesInvoiceData.customerId,
      vendorId: salesInvoiceData.vendorId,
      isActive: true
    }).session(session);

    if (!customer) {
      throw new Error('Customer not found or inactive');
    }

    // Validate employees exist
    const [deliverByEmployee, bookedByEmployee] = await Promise.all([
      Employee.findOne({
        _id: salesInvoiceData.deliverBy,
        vendorId: salesInvoiceData.vendorId,
        isActive: true
      }).session(session),
      Employee.findOne({
        _id: salesInvoiceData.bookedBy,
        vendorId: salesInvoiceData.vendorId,
        isActive: true
      }).session(session)
    ]);

    if (!deliverByEmployee) {
      throw new Error('Delivery employee not found or inactive');
    }
    if (!bookedByEmployee) {
      throw new Error('Booking employee not found or inactive');
    }

    // Auto-generate delivery log number if not provided
    if (!salesInvoiceData.deliveryLogNumber) {
      salesInvoiceData.deliveryLogNumber = await SalesInvoice.generateDeliveryLogNumber(
        salesInvoiceData.vendorId,
        salesInvoiceData.deliverBy
      );
    }

    // Check if delivery log number already exists
    const existingInvoice = await SalesInvoice.findOne({
      vendorId: salesInvoiceData.vendorId,
      deliveryLogNumber: salesInvoiceData.deliveryLogNumber
    }).session(session);

    if (existingInvoice) {
      throw new Error('Delivery log number already exists for this vendor');
    }

    // Set license information from customer if not provided
    if (!salesInvoiceData.licenseNumber) {
      salesInvoiceData.licenseNumber = customer.customerLicenseNumber;
    }
    if (!salesInvoiceData.licenseExpiry) {
      salesInvoiceData.licenseExpiry = customer.customerLicenseExpiryDate;
    }

    // Validate and process products
    const products = salesInvoiceData.products || [];
    if (products.length === 0) {
      throw new Error('At least one product is required');
    }

    let calculatedSubtotal = 0;
    let calculatedTotalDiscount = 0;
    const processedProducts = [];

    for (const productData of products) {
      // Find inventory item using FIFO (First Expiry First Out)
      const inventoryItem = await Inventory.findOne({
        _id: productData.inventoryId,
        vendorId: salesInvoiceData.vendorId,
        productId: productData.productId,
        currentQuantity: { $gte: productData.quantity },
        isActive: true
      }).session(session);

      if (!inventoryItem) {
        throw new Error(`Insufficient inventory for product ${productData.productName}. Required: ${productData.quantity}`);
      }

      // Validate pricing if not allowing below minimum
      if (!productData.lessToMinimumCheck && productData.price < inventoryItem.minSalePrice) {
        throw new Error(`Cannot sell ${productData.productName} below minimum price of ${inventoryItem.minSalePrice}`);
      }

      // Calculate amounts
      const grossAmount = productData.quantity * productData.price;
      const percentageDiscountAmount = (grossAmount * (productData.percentageDiscount || 0)) / 100;
      const totalDiscountAmount = percentageDiscountAmount + (productData.flatDiscount || 0);
      const netAmount = grossAmount - totalDiscountAmount;

      calculatedSubtotal += netAmount;
      calculatedTotalDiscount += totalDiscountAmount;

      // Prepare sales product data
      const salesProductData = {
        vendorId: salesInvoiceData.vendorId,
        productId: productData.productId,
        inventoryId: inventoryItem._id,
        productName: productData.productName,
        batchNumber: inventoryItem.batchNumber,
        expiry: inventoryItem.expiryDate,
        availableStock: inventoryItem.currentQuantity,
        quantity: productData.quantity,
        bonus: productData.bonus || 0,
        totalQuantity: productData.quantity + (productData.bonus || 0),
        lessToMinimumCheck: productData.lessToMinimumCheck || false,
        price: productData.price,
        percentageDiscount: productData.percentageDiscount || 0,
        flatDiscount: productData.flatDiscount || 0,
        effectiveCostPerPiece: netAmount / (productData.quantity + (productData.bonus || 0)),
        totalAmount: netAmount,
        originalSalePrice: inventoryItem.salePrice,
        minSalePrice: inventoryItem.minSalePrice
      };

      processedProducts.push({
        salesProductData,
        inventoryItem,
        quantityToDeduct: productData.quantity
      });
    }

    // Set calculated financial values
    salesInvoiceData.subtotal = calculatedSubtotal;
    salesInvoiceData.totalDiscount = salesInvoiceData.totalDiscount || 0;
    salesInvoiceData.grandTotal = calculatedSubtotal - salesInvoiceData.totalDiscount;

    // Create the sales invoice
    const salesInvoice = await SalesInvoice.create([salesInvoiceData], { session });
    const createdSalesInvoice = salesInvoice[0];

    // Create sales products and update inventory
    const salesProductPromises = processedProducts.map(async ({ salesProductData, inventoryItem, quantityToDeduct }) => {
      // Set the sales invoice ID
      salesProductData.salesInvoiceId = createdSalesInvoice._id;

      // Create sales product
      const salesProduct = await SalesProduct.create([salesProductData], { session });

      // Update inventory - deduct sold quantity
      await Inventory.findByIdAndUpdate(
        inventoryItem._id,
        {
          $inc: { currentQuantity: -quantityToDeduct },
          lastUpdated: new Date()
        },
        { session }
      );

      return salesProduct[0];
    });

    const createdSalesProducts = await Promise.all(salesProductPromises);

    await session.commitTransaction();

    // Return the created sales invoice with products
    const result = createdSalesInvoice.toObject();
    result.products = createdSalesProducts.map(sp => sp.toObject());

    return result;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in createSalesInvoice:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.updateSalesInvoice = async (vendorId, salesInvoiceId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingSalesInvoice = await SalesInvoice.findOne({
      _id: salesInvoiceId,
      vendorId: vendorId
    }).session(session);

    if (!existingSalesInvoice) {
      throw new Error('Sales invoice not found');
    }

    // Get existing sales products
    const existingSalesProducts = await SalesProduct.find({
      salesInvoiceId: salesInvoiceId,
      vendorId: vendorId
    }).session(session);

    // Reverse inventory changes from existing products
    for (const salesProduct of existingSalesProducts) {
      await Inventory.findByIdAndUpdate(
        salesProduct.inventoryId,
        {
          $inc: { currentQuantity: salesProduct.quantity },
          lastUpdated: new Date()
        },
        { session }
      );
    }

    // Delete existing sales products
    await SalesProduct.deleteMany({
      salesInvoiceId: salesInvoiceId,
      vendorId: vendorId
    }, { session });

    // If products are being updated, process them
    if (updateData.products && updateData.products.length > 0) {
      let calculatedSubtotal = 0;
      let calculatedTotalDiscount = 0;
      const processedProducts = [];

      for (const productData of updateData.products) {
        // Find inventory item
        const inventoryItem = await Inventory.findOne({
          _id: productData.inventoryId,
          vendorId: vendorId,
          productId: productData.productId,
          currentQuantity: { $gte: productData.quantity },
          isActive: true
        }).session(session);

        if (!inventoryItem) {
          throw new Error(`Insufficient inventory for product ${productData.productName}. Required: ${productData.quantity}`);
        }

        // Validate pricing
        if (!productData.lessToMinimumCheck && productData.price < inventoryItem.minSalePrice) {
          throw new Error(`Cannot sell ${productData.productName} below minimum price of ${inventoryItem.minSalePrice}`);
        }

        // Calculate amounts
        const grossAmount = productData.quantity * productData.price;
        const percentageDiscountAmount = (grossAmount * (productData.percentageDiscount || 0)) / 100;
        const totalDiscountAmount = percentageDiscountAmount + (productData.flatDiscount || 0);
        const netAmount = grossAmount - totalDiscountAmount;

        calculatedSubtotal += netAmount;
        calculatedTotalDiscount += totalDiscountAmount;

        // Prepare sales product data
        const salesProductData = {
          salesInvoiceId: salesInvoiceId,
          vendorId: vendorId,
          productId: productData.productId,
          inventoryId: inventoryItem._id,
          productName: productData.productName,
          batchNumber: inventoryItem.batchNumber,
          expiry: inventoryItem.expiryDate,
          availableStock: inventoryItem.currentQuantity,
          quantity: productData.quantity,
          bonus: productData.bonus || 0,
          totalQuantity: productData.quantity + (productData.bonus || 0),
          lessToMinimumCheck: productData.lessToMinimumCheck || false,
          price: productData.price,
          percentageDiscount: productData.percentageDiscount || 0,
          flatDiscount: productData.flatDiscount || 0,
          effectiveCostPerPiece: netAmount / (productData.quantity + (productData.bonus || 0)),
          totalAmount: netAmount,
          originalSalePrice: inventoryItem.salePrice,
          minSalePrice: inventoryItem.minSalePrice
        };

        processedProducts.push({
          salesProductData,
          inventoryItem,
          quantityToDeduct: productData.quantity
        });
      }

      // Update calculated financial values
      updateData.subtotal = calculatedSubtotal;
      updateData.totalDiscount = calculatedTotalDiscount;
      updateData.grandTotal = calculatedSubtotal;

      // Create new sales products and update inventory
      for (const { salesProductData, inventoryItem, quantityToDeduct } of processedProducts) {
        // Create sales product
        await SalesProduct.create([salesProductData], { session });

        // Update inventory - deduct sold quantity
        await Inventory.findByIdAndUpdate(
          inventoryItem._id,
          {
            $inc: { currentQuantity: -quantityToDeduct },
            lastUpdated: new Date()
          },
          { session }
        );
      }
    }

    // Update the sales invoice (excluding products from update data)
    const { products, ...salesInvoiceUpdate } = updateData;
    const updatedSalesInvoice = await SalesInvoice.findByIdAndUpdate(
      salesInvoiceId,
      salesInvoiceUpdate,
      { new: true, session }
    );

    await session.commitTransaction();
    return updatedSalesInvoice;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in updateSalesInvoice:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.deleteSalesInvoice = async (vendorId, salesInvoiceId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const salesInvoice = await SalesInvoice.findOne({
      _id: salesInvoiceId,
      vendorId: vendorId
    }).session(session);

    if (!salesInvoice) {
      throw new Error('Sales invoice not found');
    }

    // Get associated sales products
    const salesProducts = await SalesProduct.find({
      salesInvoiceId: salesInvoiceId,
      vendorId: vendorId
    }).session(session);

    // Reverse inventory changes
    for (const salesProduct of salesProducts) {
      await Inventory.findByIdAndUpdate(
        salesProduct.inventoryId,
        {
          $inc: { currentQuantity: salesProduct.quantity },
          lastUpdated: new Date()
        },
        { session }
      );
    }

    // Delete sales products
    await SalesProduct.deleteMany({
      salesInvoiceId: salesInvoiceId,
      vendorId: vendorId
    }, { session });

    // Delete sales invoice
    await SalesInvoice.findByIdAndDelete(salesInvoiceId, { session });

    await session.commitTransaction();
    return { message: 'Sales invoice and associated inventory changes reversed successfully' };
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in deleteSalesInvoice:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.toggleSalesInvoiceStatus = async (vendorId, salesInvoiceId) => {
  try {
    const salesInvoice = await SalesInvoice.findOne({
      _id: salesInvoiceId,
      vendorId: vendorId
    });

    if (!salesInvoice) {
      throw new Error('Sales invoice not found');
    }

    salesInvoice.isActive = !salesInvoice.isActive;
    await salesInvoice.save();

    return salesInvoice;
  } catch (error) {
    console.error('Error in toggleSalesInvoiceStatus:', error);
    throw error;
  }
};

exports.getSalesInvoicesByDateRange = async (vendorId, startDate, endDate, customerId, employeeId) => {
  try {
    let query = {
      vendorId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    if (customerId) {
      query.customerId = customerId;
    }

    if (employeeId) {
      query.$or = [
        { deliverBy: employeeId },
        { bookedBy: employeeId }
      ];
    }

    return await SalesInvoice.find(query)
      .populate('customerId', 'customerName customerAddress')
      .populate('deliverBy', 'employeeName')
      .populate('bookedBy', 'employeeName')
      .sort({ date: -1 });
  } catch (error) {
    console.error('Error in getSalesInvoicesByDateRange:', error);
    throw error;
  }
};

exports.getLastInvoiceByCustomer = async (vendorId, customerId) => {
  try {
    // Find the most recent sales invoice for the given vendor and customer
    const lastInvoice = await SalesInvoice.findOne({ 
      vendorId, 
      customerId, 
      isActive: true 
    })
    .sort({ updatedAt: -1 }) // Sort by updatedAt in descending order
    .populate('customerId', 'customerName')
    .select('licenseNumber licenseExpiry date createdAt');

    if (!lastInvoice) {
      return {
        licenseNumber: null,
        licenseExpiry: null,
        message: 'No Record'
      };
    }

    return {
      licenseNumber: lastInvoice.licenseNumber,
      licenseExpiry: lastInvoice.licenseExpiry,
      lastInvoiceDate: lastInvoice.date,
      message: 'Last invoice found'
    };
  } catch (error) {
    throw error;
  }
};

exports.getAvailableInventory = async (vendorId, productId) => {
  try {
    // Get inventory for the product, sorted by expiry date (FEFO - First Expiry First Out)
    const inventory = await Inventory.find({
      vendorId,
      productId,
      currentQuantity: { $gt: 0 }, // Only items with available stock
      isActive: true
    })
    .populate('productId', 'productName')
    .populate('brandId', 'brandName')
    .sort({ expiryDate: 1 }) // Sort by expiry date ascending (earliest first)
    .select('batchNumber expiryDate currentQuantity salePrice minSalePrice lastPurchasePrice averageCost retailPrice invoicePrice');

    return inventory;
  } catch (error) {
    console.error('Error in getAvailableInventory:', error);
    throw error;
  }
};

exports.addPaymentToCredit = async (vendorId, salesInvoiceId, paymentData) => {
  try {
    const salesInvoice = await SalesInvoice.findOne({
      _id: salesInvoiceId,
      vendorId: vendorId
    });

    if (!salesInvoice) {
      throw new Error('Sales invoice not found');
    }

    // Add payment to paymentDetails array
    salesInvoice.paymentDetails.push({
      date: new Date(paymentData.date),
      amountPaid: paymentData.amountPaid
    });

    await salesInvoice.save();

    return salesInvoice;
  } catch (error) {
    console.error('Error in addPaymentToCredit:', error);
    throw error;
  }
};

exports.removePaymentFromCredit = async (vendorId, salesInvoiceId, paymentIndex) => {
  try {
    const salesInvoice = await SalesInvoice.findOne({
      _id: salesInvoiceId,
      vendorId: vendorId
    });

    if (!salesInvoice) {
      throw new Error('Sales invoice not found');
    }

    if (paymentIndex < 0 || paymentIndex >= salesInvoice.paymentDetails.length) {
      throw new Error('Invalid payment index');
    }

    // Remove payment from paymentDetails array
    salesInvoice.paymentDetails.splice(paymentIndex, 1);

    await salesInvoice.save();

    return salesInvoice;
  } catch (error) {
    console.error('Error in removePaymentFromCredit:', error);
    throw error;
  }
};

exports.getLastThreePricesForCustomer = async (vendorId, customerId, productId) => {
  try {
    if (!customerId || !productId) {
      return [];
    }

    // Find the last 3 sales invoices that contain this product for this customer
    const salesInvoices = await SalesInvoice.find({
      vendorId: vendorId,
      customerId: customerId,
      isActive: true
    })
    .sort({ date: -1 }) // Sort by date descending (most recent first)
    .limit(10) // Get more invoices to search through
    .select('_id date deliveryLogNumber');

    if (salesInvoices.length === 0) {
      return [];
    }

    const invoiceIds = salesInvoices.map(invoice => invoice._id);

    // Find sales products for this specific product in these invoices
    const salesProducts = await SalesProduct.find({
      salesInvoiceId: { $in: invoiceIds },
      productId: productId,
      vendorId: vendorId
    })
    .populate('salesInvoiceId', 'date deliveryLogNumber')
    .sort({ createdAt: -1 }) // Sort by creation date descending
    .limit(3) // Get only the last 3 transactions
    .select('price date salesInvoiceId createdAt');

    // Format the response with price history
    return salesProducts.map(salesProduct => ({
      price: salesProduct.price,
      date: salesProduct.salesInvoiceId?.date || salesProduct.createdAt,
      invoiceNumber: salesProduct.salesInvoiceId?.deliveryLogNumber || 'N/A'
    }));

  } catch (error) {
    console.error('Error in getLastThreePricesForCustomer:', error);
    throw error;
  }
};
