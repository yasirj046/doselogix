const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const paymentDetailSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  amountPaid: {
    type: Number,
    required: [true, 'Payment amount is required'],
    // min: [0, 'Payment amount cannot be negative']
  }
}, { _id: false });

const salesInvoiceSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCustomers',
      required: [true, 'Customer ID is required'],
      index: true
    },
    
    // Sales invoice details
    date: {
      type: Date,
      required: [true, 'Sales date is required'],
      default: Date.now
    },
    
    salesInvoiceNumber: {
      type: String,
      required: false, // Will be auto-generated in pre-save hook if not provided
      unique: true,
      trim: true,
      index: true
    },
    
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      maxlength: [100, 'License number cannot exceed 100 characters']
    },
    
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required']
    },
    
    lastInvoiceBalance: {
      type: Number,
      default: 0,
      min: [0, 'Last invoice balance cannot be negative']
    },
    
    deliverBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Deliver by employee is required'],
      index: true
    },
    
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Booked by employee is required'],
      index: true
    },
    
    deliveryLogNumber: {
      type: String,
      required: false, // Will be auto-assigned by Delivery Log module after invoice creation
      trim: true,
      maxlength: [100, 'Delivery log number cannot exceed 100 characters'],
      index: true
    },
    
    // Financial details
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    
    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Total discount cannot be negative']
    },
    
    grandTotal: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative']
    },
    
    // Payment details
    cash: {
      type: Number,
      default: 0,
      min: [0, 'Cash amount cannot be negative']
    },
    
    credit: {
      type: Number,
      default: 0,
      min: [0, 'Credit amount cannot be negative']
    },
    
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    
    paymentDetails: [paymentDetailSchema],
    
    // System fields
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add pagination plugin
salesInvoiceSchema.plugin(mongoosePaginate);

// Add indexes for better performance
salesInvoiceSchema.index({ vendorId: 1, date: -1 });
salesInvoiceSchema.index({ vendorId: 1, customerId: 1 });
salesInvoiceSchema.index({ deliveryLogNumber: "text" });
salesInvoiceSchema.index({ vendorId: 1, isActive: 1 });
salesInvoiceSchema.index({ vendorId: 1, deliverBy: 1 });
salesInvoiceSchema.index({ vendorId: 1, bookedBy: 1 });

// Pre-save hook to generate sales invoice number
salesInvoiceSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.salesInvoiceNumber) {
      console.log('Auto-generating sales invoice number for new invoice...');
      // Use the date from the document, or current date if not set
      const invoiceDate = this.date || new Date();
      this.salesInvoiceNumber = await this.constructor.generateSalesInvoiceNumber(invoiceDate);
      console.log(`Sales invoice number generated: ${this.salesInvoiceNumber}`);
    } else if (this.isNew) {
      console.log(`Sales invoice number already provided: ${this.salesInvoiceNumber}`);
    }
    
    // Ensure sales invoice number is set before saving
    if (!this.salesInvoiceNumber) {
      throw new Error('Sales invoice number is required');
    }
    
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

// Virtual for total paid amount
salesInvoiceSchema.virtual('totalPaid').get(function() {
  const paymentDetails = Array.isArray(this.paymentDetails) ? this.paymentDetails : [];
  const paymentTotal = paymentDetails.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
  return (this.cash || 0) + paymentTotal;
});

// Virtual for remaining balance
salesInvoiceSchema.virtual('remainingBalance').get(function() {
  return this.grandTotal - this.totalPaid;
});

// Virtual for payment status
salesInvoiceSchema.virtual('paymentStatus').get(function() {
  const totalPaid = this.totalPaid;
  const grandTotal = this.grandTotal;
  
  if (totalPaid >= grandTotal) {
    return 'Paid';
  } else if (totalPaid > 0) {
    return 'Partial';
  } else {
    return 'Unpaid';
  }
});

// Virtual for sales products
salesInvoiceSchema.virtual('salesProducts', {
  ref: 'SalesProduct',
  localField: '_id',
  foreignField: 'salesInvoiceId',
  justOne: false
});

// Static method to get sales by customer
salesInvoiceSchema.statics.getSalesByCustomer = async function(customerId, vendorId, options = {}) {
  let query = { customerId, vendorId };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.startDate && options.endDate) {
    query.date = { $gte: options.startDate, $lte: options.endDate };
  }
  
  return await this.find(query)
    .populate('customerId', 'customerName customerAddress customerCity')
    .populate('deliverBy', 'employeeName')
    .populate('bookedBy', 'employeeName')
    .sort({ date: -1 });
};

// Static method to get sales by employee
salesInvoiceSchema.statics.getSalesByEmployee = async function(employeeId, vendorId, options = {}) {
  let query = { 
    vendorId,
    $or: [
      { deliverBy: employeeId },
      { bookedBy: employeeId }
    ]
  };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.startDate && options.endDate) {
    query.date = { $gte: options.startDate, $lte: options.endDate };
  }
  
  return await this.find(query)
    .populate('customerId', 'customerName customerAddress customerCity')
    .populate('deliverBy', 'employeeName')
    .populate('bookedBy', 'employeeName')
    .sort({ date: -1 });
};

// Static method to get last invoice by customer
salesInvoiceSchema.statics.getLastInvoiceByCustomer = async function(customerId, vendorId) {
  return await this.findOne({ customerId, vendorId, isActive: true })
    .populate('customerId', 'customerName customerLicenseNumber customerLicenseExpiryDate')
    .sort({ date: -1 });
};

// NOTE: deliveryLogNumber is now generated by the Delivery Log module
// and automatically assigned when a sales invoice is created.
// See: deliveryLogModel.js and the delivery log integration in salesInvoiceService.js

// Static method to generate sales invoice number
salesInvoiceSchema.statics.generateSalesInvoiceNumber = async function(date) {
  // Ensure date is a valid Date object
  const invoiceDate = date instanceof Date ? date : new Date(date);
  
  const year = invoiceDate.getFullYear();
  const yy = (year % 100).toString().padStart(2, '0');
  const mm = (invoiceDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = invoiceDate.getDate().toString().padStart(2, '0');
  const mmdd = mm + dd;
  
  // Prefix pattern for this specific date
  const fullPrefix = `SINV-${yy}-${mmdd}-`;
  
  // Prefix pattern for this year (to find highest counter across all dates this year)
  const yearPrefix = `SINV-${yy}-`;

  // Find the last invoice for this YEAR (not just this date) to get the next counter
  const lastInvoice = await this.findOne({
    salesInvoiceNumber: { $regex: `^${yearPrefix}` }
  }).sort({ salesInvoiceNumber: -1 });

  let counter = 1;
  if (lastInvoice && lastInvoice.salesInvoiceNumber) {
    // Extract the counter from the last invoice (last 6 digits)
    const lastCounter = parseInt(lastInvoice.salesInvoiceNumber.slice(-6));
    if (!isNaN(lastCounter)) {
      counter = lastCounter + 1;
    }
  }

  const counterStr = counter.toString().padStart(6, '0');
  console.log(`Generated Sales Invoice Number: ${fullPrefix}${counterStr} (Year: ${year}, Date: ${mmdd}, Counter: ${counter})`);
  return `${fullPrefix}${counterStr}`;
};

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);
