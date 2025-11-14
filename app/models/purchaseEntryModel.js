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

const purchaseEntrySchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to brand
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand ID is required'],
      index: true
    },
    
    // Purchase entry details
    date: {
      type: Date,
      required: [true, 'Purchase date is required'],
      default: Date.now
    },
    
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
      maxlength: [100, 'Invoice number cannot exceed 100 characters']
    },
    
    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required']
    },
    
    lastInvoiceNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Last invoice number cannot exceed 100 characters']
    },
    
    lastInvoicePrice: {
      type: Number,
      default: 0,
      min: [0, 'Last invoice price cannot be negative']
    },
    
    // Financial details
    grossTotal: {
      type: Number,
      required: [true, 'Gross total is required'],
      min: [0, 'Gross total cannot be negative']
    },
    
    freight: {
      type: Number,
      default: 0,
      min: [0, 'Freight cannot be negative']
    },
    
    flatDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Flat discount cannot be negative']
    },
    
    specialDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Special discount cannot be negative']
    },
    
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    
    grandTotal: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative']
    },
    
    // Payment details
    creditAmount: {
      type: Number,
      default: 0,
      min: [-999999, 'Credit amount cannot be less than -999,999']
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
purchaseEntrySchema.plugin(mongoosePaginate);

// Add indexes for better performance
purchaseEntrySchema.index({ vendorId: 1, date: -1 });
purchaseEntrySchema.index({ vendorId: 1, brandId: 1 });
purchaseEntrySchema.index({ vendorId: 1, invoiceNumber: 1 }, { unique: true });
purchaseEntrySchema.index({ invoiceNumber: "text" });
purchaseEntrySchema.index({ vendorId: 1, isActive: 1 });

// Virtual for total paid amount
purchaseEntrySchema.virtual('totalPaid').get(function() {
  const paymentTotal = this.paymentDetails.reduce((sum, payment) => sum + payment.amountPaid, 0);
  return paymentTotal;
});

// Virtual for remaining balance
purchaseEntrySchema.virtual('remainingBalance').get(function() {
  // Remaining (outstanding) balance is how much is still owed:
  // grandTotal - totalPaid. Previously this returned totalPaid - grandTotal
  // which inverted the sign and led to incorrect outstanding values.
  return (this.grandTotal || 0) - (this.totalPaid || 0);
});

// Virtual for payment status
purchaseEntrySchema.virtual('paymentStatus').get(function() {
  const creditAmount = this.creditAmount || 0;
  const creditPayments = this.paymentDetails.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
  const totalPaid = creditPayments;
  const remainingCredit = creditAmount - creditPayments;
  
  if (totalPaid >= this.grandTotal || remainingCredit <= 0) return 'Paid';
  if (totalPaid > 0) return 'Partial';
  return 'Unpaid';
});

// Virtual for remaining credit balance
purchaseEntrySchema.virtual('remainingCredit').get(function() {
  const creditPayments = this.paymentDetails.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
  return Math.max(0, (this.creditAmount || 0) - creditPayments);
});

// Static method to find purchase entries by vendor
purchaseEntrySchema.statics.findPurchaseEntriesByVendor = async function(vendorId, options = {}) {
  const query = { vendorId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.brandId) {
    query.brandId = options.brandId;
  }
  
  if (options.startDate && options.endDate) {
    query.date = { $gte: options.startDate, $lte: options.endDate };
  } else if (options.startDate) {
    query.date = { $gte: options.startDate };
  } else if (options.endDate) {
    query.date = { $lte: options.endDate };
  }
  
  return await this.find(query)
    .populate('vendorId', 'vendorName vendorEmail')
    .populate('brandId', 'brandName')
    .sort({ date: -1 });
};

// Static method to find purchase entries by date range
purchaseEntrySchema.statics.findByDateRange = async function(vendorId, startDate, endDate, options = {}) {
  const query = { 
    vendorId,
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.brandId) {
    query.brandId = options.brandId;
  }
  
  return await this.find(query)
    .populate('vendorId', 'vendorName vendorEmail')
    .populate('brandId', 'brandName')
    .sort({ date: -1 });
};

// Static method to get purchase statistics
purchaseEntrySchema.statics.getPurchaseStats = async function(vendorId, options = {}) {
  const matchQuery = { vendorId };
  
  if (typeof options.isActive === 'boolean') {
    matchQuery.isActive = options.isActive;
  }
  
  if (options.startDate && options.endDate) {
    matchQuery.date = { $gte: options.startDate, $lte: options.endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalGrossAmount: { $sum: '$grossTotal' },
        totalGrandAmount: { $sum: '$grandTotal' },
        totalPaid: { $sum: { $sum: '$paymentDetails.amountPaid' } },
        totalFreight: { $sum: '$freight' },
        totalDiscounts: { $sum: { $add: ['$flatDiscount', '$specialDiscount'] } }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalEntries: 0,
    totalGrossAmount: 0,
    totalGrandAmount: 0,
    totalPaid: 0,
    totalFreight: 0,
    totalDiscounts: 0
  };
};

module.exports = mongoose.model("PurchaseEntry", purchaseEntrySchema);
