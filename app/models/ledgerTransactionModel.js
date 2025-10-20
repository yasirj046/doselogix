const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const ledgerTransactionSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Transaction details
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true
    },
    
    // Transaction type and reference
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['SALES_INVOICE', 'PURCHASE_INVOICE', 'EXPENSE'],
      index: true
    },
    
    // Reference to the original transaction
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Reference ID is required'],
      index: true
    },
    
    referenceNumber: {
      type: String,
      required: [true, 'Reference number is required'],
      trim: true,
      maxlength: [100, 'Reference number cannot exceed 100 characters']
    },
    
    // Customer/Supplier information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCustomers',
      index: true
    },
    
    customerName: {
      type: String,
      trim: true,
      maxlength: [200, 'Customer name cannot exceed 200 characters']
    },
    
    // Financial details
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    // Debit side (money coming in)
    debitAmount: {
      type: Number,
      default: 0,
      min: [0, 'Debit amount cannot be negative']
    },
    
    // Credit side (money going out)
    creditAmount: {
      type: Number,
      default: 0,
      min: [0, 'Credit amount cannot be negative']
    },
    
    // Payment details
    cashAmount: {
      type: Number,
      default: 0,
      min: [0, 'Cash amount cannot be negative']
    },
    
    creditPaymentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Credit payment amount cannot be negative']
    },
    
    
    // Payment status
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID'
    },
    
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
ledgerTransactionSchema.plugin(mongoosePaginate);

// Add indexes for better performance
ledgerTransactionSchema.index({ vendorId: 1, transactionDate: -1 });
ledgerTransactionSchema.index({ vendorId: 1, transactionType: 1 });
ledgerTransactionSchema.index({ vendorId: 1, customerId: 1 });
ledgerTransactionSchema.index({ vendorId: 1, referenceId: 1 });
ledgerTransactionSchema.index({ vendorId: 1, paymentStatus: 1 });
ledgerTransactionSchema.index({ vendorId: 1, isActive: 1 });

// Virtual for net amount (debit - credit)
ledgerTransactionSchema.virtual('netAmount').get(function() {
  return this.debitAmount - this.creditAmount;
});

// Virtual for formatted transaction date
ledgerTransactionSchema.virtual('formattedDate').get(function() {
  return this.transactionDate.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
});

// Static method to get transactions by date range
ledgerTransactionSchema.statics.getTransactionsByDateRange = async function(vendorId, startDate, endDate, options = {}) {
  const query = { 
    vendorId,
    transactionDate: { $gte: startDate, $lte: endDate }
  };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.transactionType) {
    query.transactionType = options.transactionType;
  }
  
  if (options.customerId) {
    query.customerId = options.customerId;
  }
  
  if (options.paymentStatus) {
    query.paymentStatus = options.paymentStatus;
  }
  
  return await this.find(query)
    .populate('customerId', 'customerName customerAddress customerCity')
    .sort({ transactionDate: -1, createdAt: -1 });
};

// Static method to get ledger summary
ledgerTransactionSchema.statics.getLedgerSummary = async function(vendorId, startDate, endDate) {
  const matchQuery = { 
    vendorId,
    transactionDate: { $gte: startDate, $lte: endDate },
    isActive: true
  };
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalDebit: { $sum: '$debitAmount' },
        totalCredit: { $sum: '$creditAmount' },
        totalCash: { $sum: '$cashAmount' },
        totalCreditPaymentAmount: { $sum: '$creditPaymentAmount' },
        totalTransactions: { $sum: 1 },
        salesTransactions: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'SALES_INVOICE'] }, 1, 0] }
        },
        purchaseTransactions: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'PURCHASE_INVOICE'] }, 1, 0] }
        },
        expenseTransactions: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'EXPENSE'] }, 1, 0] }
        },
        paidTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
        },
        partialTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'PARTIAL'] }, 1, 0] }
        },
        unpaidTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'UNPAID'] }, 1, 0] }
        }
      }
    }
  ]);
  
  const result = summary.length > 0 ? summary[0] : {
    totalDebit: 0,
    totalCredit: 0,
    totalCash: 0,
    totalCreditPaymentAmount: 0,
    totalTransactions: 0,
    salesTransactions: 0,
    purchaseTransactions: 0,
    expenseTransactions: 0,
    paidTransactions: 0,
    partialTransactions: 0,
    unpaidTransactions: 0
  };
  
  // Calculate net profit/loss
  result.netProfit = result.totalDebit - result.totalCredit;
  result.totalReceivable = result.totalCreditPaymentAmount;
  result.totalPayable = 0; // This will be calculated separately for purchases
  
  return result;
};

// Static method to get customer-wise summary
ledgerTransactionSchema.statics.getCustomerSummary = async function(vendorId, startDate, endDate) {
  const matchQuery = { 
    vendorId,
    transactionDate: { $gte: startDate, $lte: endDate },
    isActive: true,
    customerId: { $exists: true }
  };
  
  return await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$customerId',
        customerName: { $first: '$customerName' },
        totalDebit: { $sum: '$debitAmount' },
        totalCredit: { $sum: '$creditAmount' },
        totalCash: { $sum: '$cashAmount' },
        totalCreditPaymentAmount: { $sum: '$creditPaymentAmount' },
        totalTransactions: { $sum: 1 },
        paidTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
        },
        partialTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'PARTIAL'] }, 1, 0] }
        },
        unpaidTransactions: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'UNPAID'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        netAmount: { $subtract: ['$totalDebit', '$totalCredit'] },
        receivableAmount: '$totalCreditPaymentAmount'
      }
    },
    { $sort: { netAmount: -1 } }
  ]);
};

// Static method to create transaction from sales invoice
ledgerTransactionSchema.statics.createFromSalesInvoice = async function(salesInvoice) {
  const transaction = new this({
    vendorId: salesInvoice.vendorId,
    transactionDate: salesInvoice.date,
    transactionType: 'SALES_INVOICE',
    referenceId: salesInvoice._id,
    referenceNumber: salesInvoice.deliveryLogNumber,
    customerId: salesInvoice.customerId,
    description: `Sales Invoice - ${salesInvoice.deliveryLogNumber}`,
    debitAmount: salesInvoice.grandTotal,
    creditAmount: 0,
    cashAmount: salesInvoice.cash,
    creditPaymentAmount: salesInvoice.credit,
    paymentStatus: salesInvoice.paymentStatus
  });
  
  return await transaction.save();
};

// Static method to create transaction from purchase entry
ledgerTransactionSchema.statics.createFromPurchaseEntry = async function(purchaseEntry) {
  const transaction = new this({
    vendorId: purchaseEntry.vendorId,
    transactionDate: purchaseEntry.date,
    transactionType: 'PURCHASE_INVOICE',
    referenceId: purchaseEntry._id,
    referenceNumber: purchaseEntry.invoiceNumber,
    description: `Purchase Invoice - ${purchaseEntry.invoiceNumber}`,
    debitAmount: 0,
    creditAmount: purchaseEntry.grandTotal,
    cashAmount: purchaseEntry.cashPaid,
    creditPaymentAmount: purchaseEntry.creditAmount,
    paymentStatus: purchaseEntry.paymentStatus
  });
  
  return await transaction.save();
};

// Static method to create transaction from expense
ledgerTransactionSchema.statics.createFromExpense = async function(expense) {
  const transaction = new this({
    vendorId: expense.vendorId,
    transactionDate: expense.date,
    transactionType: 'EXPENSE',
    referenceId: expense._id,
    referenceNumber: `EXP-${expense._id.toString().slice(-6)}`,
    description: `Expense - ${expense.description}`,
    debitAmount: 0,
    creditAmount: expense.amount,
    cashAmount: expense.amount,
    creditPaymentAmount: 0,
    paymentStatus: 'PAID'
  });
  
  return await transaction.save();
};

module.exports = mongoose.model("LedgerTransaction", ledgerTransactionSchema);
