const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const ledgerSnapshotSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Snapshot date
    snapshotDate: {
      type: Date,
      required: [true, 'Snapshot date is required'],
      index: true
    },
    
    // Financial summary
    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'Total sales cannot be negative']
    },
    
    totalPurchases: {
      type: Number,
      default: 0,
      min: [0, 'Total purchases cannot be negative']
    },
    
    totalExpenses: {
      type: Number,
      default: 0,
      min: [0, 'Total expenses cannot be negative']
    },
    
    totalCashReceived: {
      type: Number,
      default: 0,
      min: [0, 'Total cash received cannot be negative']
    },
    
    totalCashPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total cash paid cannot be negative']
    },
    
    totalCreditReceived: {
      type: Number,
      default: 0,
      min: [0, 'Total credit received cannot be negative']
    },
    
    totalCreditPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total credit paid cannot be negative']
    },
    
    // Calculated fields
    netProfit: {
      type: Number,
      default: 0
    },
    
    totalReceivable: {
      type: Number,
      default: 0,
      min: [0, 'Total receivable cannot be negative']
    },
    
    totalPayable: {
      type: Number,
      default: 0,
      min: [0, 'Total payable cannot be negative']
    },
    
    // Transaction counts
    totalTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Total transactions cannot be negative']
    },
    
    salesCount: {
      type: Number,
      default: 0,
      min: [0, 'Sales count cannot be negative']
    },
    
    purchaseCount: {
      type: Number,
      default: 0,
      min: [0, 'Purchase count cannot be negative']
    },
    
    expenseCount: {
      type: Number,
      default: 0,
      min: [0, 'Expense count cannot be negative']
    },
    
    // Payment status counts
    paidTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Paid transactions cannot be negative']
    },
    
    partialTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Partial transactions cannot be negative']
    },
    
    unpaidTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Unpaid transactions cannot be negative']
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
ledgerSnapshotSchema.plugin(mongoosePaginate);

// Add indexes for better performance
ledgerSnapshotSchema.index({ vendorId: 1, snapshotDate: -1 });
ledgerSnapshotSchema.index({ vendorId: 1, isActive: 1 });
ledgerSnapshotSchema.index({ snapshotDate: -1 });

// Virtual for formatted snapshot date
ledgerSnapshotSchema.virtual('formattedDate').get(function() {
  return this.snapshotDate.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
});

// Virtual for cash flow
ledgerSnapshotSchema.virtual('cashFlow').get(function() {
  return this.totalCashReceived - this.totalCashPaid;
});

// Virtual for credit flow
ledgerSnapshotSchema.virtual('creditFlow').get(function() {
  return this.totalCreditReceived - this.totalCreditPaid;
});

// Static method to create daily snapshot
ledgerSnapshotSchema.statics.createDailySnapshot = async function(vendorId, date) {
  const LedgerTransaction = require('./ledgerTransactionModel');
  
  // Get start and end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get transactions for the day
  const transactions = await LedgerTransaction.find({
    vendorId,
    transactionDate: { $gte: startOfDay, $lte: endOfDay },
    isActive: true
  });
  
  // Calculate summary
  const summary = transactions.reduce((acc, transaction) => {
    acc.totalTransactions++;
    
    switch (transaction.transactionType) {
      case 'SALES_INVOICE':
        acc.totalSales += transaction.debitAmount;
        acc.totalCashReceived += transaction.cashAmount;
        acc.totalCreditReceived += transaction.creditAmount;
        acc.salesCount++;
        break;
      case 'PURCHASE_INVOICE':
        acc.totalPurchases += transaction.creditAmount;
        acc.totalCashPaid += transaction.cashAmount;
        acc.totalCreditPaid += transaction.creditAmount;
        acc.purchaseCount++;
        break;
      case 'EXPENSE':
        acc.totalExpenses += transaction.creditAmount;
        acc.totalCashPaid += transaction.cashAmount;
        acc.expenseCount++;
        break;
    }
    
    // Count payment status
    switch (transaction.paymentStatus) {
      case 'PAID':
        acc.paidTransactions++;
        break;
      case 'PARTIAL':
        acc.partialTransactions++;
        break;
      case 'UNPAID':
        acc.unpaidTransactions++;
        break;
    }
    
    return acc;
  }, {
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalCashReceived: 0,
    totalCashPaid: 0,
    totalCreditReceived: 0,
    totalCreditPaid: 0,
    totalTransactions: 0,
    salesCount: 0,
    purchaseCount: 0,
    expenseCount: 0,
    paidTransactions: 0,
    partialTransactions: 0,
    unpaidTransactions: 0
  });
  
  // Calculate derived fields
  summary.netProfit = summary.totalSales - summary.totalPurchases - summary.totalExpenses;
  summary.totalReceivable = summary.totalCreditReceived;
  summary.totalPayable = summary.totalCreditPaid;
  
  // Create snapshot
  const snapshot = new this({
    vendorId,
    snapshotDate: date,
    ...summary
  });
  
  return await snapshot.save();
};

// Static method to get snapshots by date range
ledgerSnapshotSchema.statics.getSnapshotsByDateRange = async function(vendorId, startDate, endDate) {
  return await this.find({
    vendorId,
    snapshotDate: { $gte: startDate, $lte: endDate },
    isActive: true
  }).sort({ snapshotDate: -1 });
};

// Static method to get latest snapshot
ledgerSnapshotSchema.statics.getLatestSnapshot = async function(vendorId) {
  return await this.findOne({
    vendorId,
    isActive: true
  }).sort({ snapshotDate: -1 });
};

// Static method to get snapshot summary for date range
ledgerSnapshotSchema.statics.getSnapshotSummary = async function(vendorId, startDate, endDate) {
  const snapshots = await this.find({
    vendorId,
    snapshotDate: { $gte: startDate, $lte: endDate },
    isActive: true
  });
  
  if (snapshots.length === 0) {
    return {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalCashReceived: 0,
      totalCashPaid: 0,
      totalCreditReceived: 0,
      totalCreditPaid: 0,
      netProfit: 0,
      totalReceivable: 0,
      totalPayable: 0,
      totalTransactions: 0,
      salesCount: 0,
      purchaseCount: 0,
      expenseCount: 0,
      paidTransactions: 0,
      partialTransactions: 0,
      unpaidTransactions: 0
    };
  }
  
  // Sum up all snapshots
  const summary = snapshots.reduce((acc, snapshot) => {
    acc.totalSales += snapshot.totalSales;
    acc.totalPurchases += snapshot.totalPurchases;
    acc.totalExpenses += snapshot.totalExpenses;
    acc.totalCashReceived += snapshot.totalCashReceived;
    acc.totalCashPaid += snapshot.totalCashPaid;
    acc.totalCreditReceived += snapshot.totalCreditReceived;
    acc.totalCreditPaid += snapshot.totalCreditPaid;
    acc.totalTransactions += snapshot.totalTransactions;
    acc.salesCount += snapshot.salesCount;
    acc.purchaseCount += snapshot.purchaseCount;
    acc.expenseCount += snapshot.expenseCount;
    acc.paidTransactions += snapshot.paidTransactions;
    acc.partialTransactions += snapshot.partialTransactions;
    acc.unpaidTransactions += snapshot.unpaidTransactions;
    
    return acc;
  }, {
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalCashReceived: 0,
    totalCashPaid: 0,
    totalCreditReceived: 0,
    totalCreditPaid: 0,
    totalTransactions: 0,
    salesCount: 0,
    purchaseCount: 0,
    expenseCount: 0,
    paidTransactions: 0,
    partialTransactions: 0,
    unpaidTransactions: 0
  });
  
  // Calculate derived fields
  summary.netProfit = summary.totalSales - summary.totalPurchases - summary.totalExpenses;
  summary.totalReceivable = summary.totalCreditReceived;
  summary.totalPayable = summary.totalCreditPaid;
  
  return summary;
};

module.exports = mongoose.model("LedgerSnapshot", ledgerSnapshotSchema);
