const Invoice = require("../models/invoiceModel");
const InvoiceCounter = require("../models/invoiceCounterModel");
const Customer = require("../models/customerModel");
const Employee = require("../models/employeeModel");
const Product = require("../models/productModel");
const Inventory = require("../models/inventoryModel");
const ledgerService = require("./ledgerService");
const deliveryAssignmentService = require("./deliveryAssignmentService");
const mongoose = require("mongoose");

// Generate unique invoice ID
const generateInvoiceId = async () => {
  const counter = await InvoiceCounter.findByIdAndUpdate(
    { _id: "invoiceId" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return `INV-${counter.sequence_value.toString().padStart(6, "0")}`;
};

// Get available stock for a product batch (FIFO - earliest expiry first)
const getAvailableStock = async (productId) => {
  try {
    const inventory = await Inventory.aggregate([
      { $match: { isActive: true, 'products.productId': new mongoose.Types.ObjectId(productId) } },
      { $unwind: '$products' },
      { $match: { 'products.productId': new mongoose.Types.ObjectId(productId) } },
      { 
        $group: {
          _id: {
            batchNumber: '$products.batchNumber',
            expiry: '$products.expiry'
          },
          totalStock: { $sum: '$products.totalQuantity' },
          price: { $first: '$products.salePrice' },
          minimumPrice: { $first: '$products.minSalePrice' }
        }
      },
      { $sort: { '_id.expiry': 1 } }, // FIFO - earliest expiry first
      { $limit: 1 } // Get the batch with earliest expiry
    ]);

    if (inventory.length === 0) {
      throw new Error('No stock available for this product');
    }

    return {
      batchNumber: inventory[0]._id.batchNumber,
      expiry: inventory[0]._id.expiry,
      availableStock: inventory[0].totalStock,
      price: inventory[0].price,
      minimumPrice: inventory[0].minimumPrice
    };
  } catch (error) {
    throw new Error(`Error getting stock: ${error.message}`);
  }
};

// Get customer's last invoice
const getLastInvoice = async (customerId) => {
  try {
    const lastInvoice = await Invoice.findOne(
      { customerId, isActive: true },
      { invoiceId: 1 },
      { sort: { createdAt: -1 } }
    );
    return lastInvoice ? lastInvoice.invoiceId : null;
  } catch (error) {
    return null;
  }
};

// Calculate customer balance
const calculateCustomerBalance = async (customerId) => {
  try {
    const result = await Invoice.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId), isActive: true } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$grandTotal' },
          totalReceived: { $sum: '$cashReceived' }
        }
      }
    ]);

    if (result.length === 0) return 0;
    return result[0].totalInvoiced - result[0].totalReceived;
  } catch (error) {
    return 0;
  }
};

// Create invoice entry with payment integration
const invoiceService = {
  async createInvoice(invoiceData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Generate invoice ID
      const invoiceId = await generateInvoiceId();
      
      // Validate customer exists
      const customer = await Customer.findById(invoiceData.customerId).session(session);
      if (!customer) {
        throw new Error("Customer not found");
      }
      
      // Validate employees
      const driver = await Employee.findById(invoiceData.deliverBy).session(session);
      if (!driver || driver.role !== 'driver') {
        throw new Error("Invalid delivery person - must be a driver");
      }
      
      const salesman = await Employee.findById(invoiceData.bookedBy).session(session);
      if (!salesman || salesman.role !== 'salesman') {
        throw new Error("Invalid booking person - must be a salesman");
      }
      
      // Get last invoice and current balance
      const lastInvoice = await getLastInvoice(invoiceData.customerId);
      const currentBalance = await calculateCustomerBalance(invoiceData.customerId);
      
      // Process products with FIFO batch selection
      const processedProducts = [];
      
      for (const productData of invoiceData.products) {
        // Validate product exists
        const product = await Product.findById(productData.productId).session(session);
        if (!product) {
          throw new Error(`Product not found: ${productData.productId}`);
        }
        
        // Get available stock with FIFO batch selection
        const stockInfo = await getAvailableStock(productData.productId);
        
        // Validate quantity
        if (productData.quantity > stockInfo.availableStock) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${stockInfo.availableStock}, Requested: ${productData.quantity}`);
        }
        
        // Validate minimum price if lessToMinimum is not checked
        const finalPrice = productData.price || stockInfo.price;
        if (!productData.lessToMinimum && finalPrice < stockInfo.minimumPrice) {
          throw new Error(`Price below minimum for ${product.name}. Minimum: ${stockInfo.minimumPrice}, Provided: ${finalPrice}`);
        }
        
        // Create processed product
        const processedProduct = {
          productId: productData.productId,
          productName: product.name,
          batchNumber: stockInfo.batchNumber,
          expiry: stockInfo.expiry,
          availableStock: stockInfo.availableStock,
          quantity: productData.quantity,
          bonus: productData.bonus || 0,
          lessToMinimum: productData.lessToMinimum || false,
          price: finalPrice,
          minimumPrice: stockInfo.minimumPrice,
          percentageDiscount: productData.percentageDiscount || 0,
          flatDiscount: productData.flatDiscount || 0,
          totalQuantity: 0, // Will be calculated in pre-save
          effectiveCostPerPiece: 0, // Will be calculated in pre-save
          totalAmount: 0 // Will be calculated in pre-save
        };
        
        processedProducts.push(processedProduct);
      }
      
      // Generate delivery log
      const dateStr = (invoiceData.date || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
      const deliveryLog = `${driver.area || 'AREA'}-${driver.name.replace(/\s+/g, '')}-${dateStr}`;
      
      // Create invoice entry
      const invoice = new Invoice({
        invoiceId,
        date: invoiceData.date || new Date(),
        customerId: invoiceData.customerId,
        customerName: customer.name,
        license: customer.license,
        licenseExpiry: customer.licenseExpiry,
        lastInvoice,
        currentBalance,
        deliverBy: invoiceData.deliverBy,
        bookedBy: invoiceData.bookedBy,
        deliveryLog,
        products: processedProducts,
        totalDiscount: invoiceData.totalDiscount || 0,
        remarks: invoiceData.remarks || "",
        // Payment fields
        cashReceived: invoiceData.cashReceived || 0,
        creditAmount: invoiceData.creditAmount || 0,
        paymentNotes: invoiceData.paymentNotes || "",
        paymentDate: invoiceData.paymentDate || new Date(),
        subTotal: 0, // Will be calculated in pre-save
        grandTotal: 0 // Will be calculated in pre-save
      });
      
      await invoice.save({ session });
      
      // Auto-create receivable ledger entry
      const ledgerEntry = await ledgerService.createReceivable({
        accountId: invoice.customerId,
        accountDetails: invoice.customerName,
        date: invoice.paymentDate,
        cash: invoice.cashReceived,
        credit: invoice.creditAmount,
        remarks: invoiceData.paymentNotes || `Auto-generated from Invoice ${invoice.invoiceId}`,
        sourceType: 'INVOICE',
        sourceId: invoice._id
      });
      
      // Link ledger entry to invoice
      invoice.ledgerEntryId = ledgerEntry._id;
      await invoice.save({ session });
      
      await session.commitTransaction();
      
      // Auto-assign invoice to delivery log (outside transaction to prevent blocking)
      try {
        await deliveryAssignmentService.autoAssignInvoice(invoice, invoiceData.userId || null);
        console.log(`✅ Invoice ${invoice.invoiceId} auto-assigned to delivery log`);
      } catch (deliveryError) {
        console.warn(`⚠️ Warning: Failed to auto-assign invoice to delivery log: ${deliveryError.message}`);
        // Don't throw error - invoice is created successfully, delivery assignment is optional
      }
      
      return invoice;
      
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to create invoice: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  // Get all invoices with pagination
  async getAllInvoices(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = 'active',
        customerId = '',
        employeeId = '',
        paymentStatus = '',
        startDate = '',
        endDate = '',
        sortBy = '-createdAt'
      } = options;

      // Build query
      const query = { 
        isActive: status === "active" ? true : status === "inactive" ? false : { $in: [true, false] } 
      };
      
      if (search) {
        query.$or = [
          { invoiceId: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { license: { $regex: search, $options: "i" } }
        ];
      }
      
      if (customerId) {
        query.customerId = customerId;
      }
      
      if (employeeId) {
        query.$or = [
          { deliverBy: employeeId },
          { bookedBy: employeeId }
        ];
      }
      
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const result = await Invoice.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy,
        populate: [
          { path: 'customerId', select: 'name license licenseExpiry' },
          { path: 'deliverBy', select: 'name role area' },
          { path: 'bookedBy', select: 'name role' },
          { path: 'products.productId', select: 'name category' }
        ]
      });

      return {
        success: true,
        data: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.totalDocs,
          pages: result.totalPages
        }
      };
    } catch (error) {
      throw new Error(`Error fetching invoices: ${error.message}`);
    }
  },

  // Get invoice by ID
  async getInvoiceById(id) {
    try {
      const invoice = await Invoice.findById(id)
        .populate('customerId', 'name license licenseExpiry')
        .populate('deliverBy', 'name role area')
        .populate('bookedBy', 'name role')
        .populate('products.productId', 'name category')
        .populate('ledgerEntryId');
      
      if (!invoice || !invoice.isActive) {
        throw new Error("Invoice not found");
      }
      
      return invoice;
    } catch (error) {
      throw new Error(`Error fetching invoice: ${error.message}`);
    }
  },

  // Update invoice payment
  async updateInvoicePayment(id, paymentData, userId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const invoice = await Invoice.findById(id).session(session);
      if (!invoice || !invoice.isActive) {
        throw new Error("Invoice not found");
      }
      
      // Update payment fields
      invoice.cashReceived = paymentData.cashReceived || 0;
      invoice.creditAmount = paymentData.creditAmount || 0;
      invoice.paymentNotes = paymentData.paymentNotes || invoice.paymentNotes;
      invoice.paymentDate = paymentData.paymentDate || invoice.paymentDate;
      
      await invoice.save({ session });
      
      // Update linked ledger entry
      if (invoice.ledgerEntryId) {
        await ledgerService.updateLedgerEntry(invoice.ledgerEntryId, {
          cash: invoice.cashReceived,
          credit: invoice.creditAmount,
          remarks: paymentData.paymentNotes || invoice.paymentNotes,
          date: invoice.paymentDate
        }, userId);
      }
      
      await session.commitTransaction();
      
      // Update delivery assignment with new payment info (outside transaction)
      try {
        await deliveryAssignmentService.updateInvoiceInDeliveryLog(invoice, userId);
        console.log(`✅ Invoice ${invoice.invoiceId} updated in delivery assignment`);
      } catch (deliveryError) {
        console.warn(`⚠️ Warning: Failed to update invoice in delivery assignment: ${deliveryError.message}`);
        // Don't throw error - payment update is successful, delivery update is secondary
      }
      
      return invoice;
      
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to update payment: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  // Get invoice statistics
  async getInvoiceStats() {
    try {
      const stats = await Invoice.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalAmount: { $sum: '$grandTotal' },
            totalReceived: { $sum: '$cashReceived' },
            totalPending: { $sum: '$creditAmount' },
            paidInvoices: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'fully_paid'] }, 1, 0] }
            },
            partiallyPaidInvoices: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'partially_paid'] }, 1, 0] }
            },
            unpaidInvoices: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        totalInvoices: 0,
        totalAmount: 0,
        totalReceived: 0,
        totalPending: 0,
        paidInvoices: 0,
        partiallyPaidInvoices: 0,
        unpaidInvoices: 0
      };
    } catch (error) {
      throw new Error(`Error fetching invoice stats: ${error.message}`);
    }
  },

  // Delete invoice (soft delete)
  async deleteInvoice(id) {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice || !invoice.isActive) {
        throw new Error("Invoice not found");
      }
      
      invoice.isActive = false;
      await invoice.save();
      
      // Also deactivate linked ledger entry
      if (invoice.ledgerEntryId) {
        await ledgerService.deleteLedgerEntry(invoice.ledgerEntryId);
      }
      
      // Remove invoice from delivery assignment
      try {
        await deliveryAssignmentService.removeInvoiceFromDeliveryLog(invoice._id);
        console.log(`✅ Invoice ${invoice.invoiceId} removed from delivery assignment`);
      } catch (deliveryError) {
        console.warn(`⚠️ Warning: Failed to remove invoice from delivery assignment: ${deliveryError.message}`);
        // Don't throw error - invoice deletion is successful, delivery update is secondary
      }
      
      return { message: "Invoice deleted successfully" };
      
    } catch (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }
};

module.exports = invoiceService;
