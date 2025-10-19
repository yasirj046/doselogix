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
    min: [0, 'Payment amount cannot be negative']
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
      required: [true, 'Delivery log number is required'],
      trim: true,
      maxlength: [100, 'Delivery log number cannot exceed 100 characters']
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
salesInvoiceSchema.index({ vendorId: 1, deliveryLogNumber: 1 }, { unique: true });
salesInvoiceSchema.index({ deliveryLogNumber: "text" });
salesInvoiceSchema.index({ vendorId: 1, isActive: 1 });
salesInvoiceSchema.index({ vendorId: 1, deliverBy: 1 });
salesInvoiceSchema.index({ vendorId: 1, bookedBy: 1 });

// Virtual for total paid amount
salesInvoiceSchema.virtual('totalPaid').get(function() {
  const paymentTotal = this.paymentDetails.reduce((sum, payment) => sum + payment.amountPaid, 0);
  return this.cash + paymentTotal;
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

// Static method to generate delivery log number
salesInvoiceSchema.statics.generateDeliveryLogNumber = async function(vendorId, employeeId) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get the last sales invoice for this employee today
  const lastInvoice = await this.findOne({
    vendorId,
    deliverBy: employeeId,
    date: {
      $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    }
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastInvoice && lastInvoice.deliveryLogNumber) {
    // Extract sequence from last delivery log number
    const lastSequence = parseInt(lastInvoice.deliveryLogNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `DL${dateStr}${employeeId.toString().slice(-4)}${sequence.toString().padStart(3, '0')}`;
};

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);
