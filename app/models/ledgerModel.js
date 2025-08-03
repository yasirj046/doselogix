const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const ledgerSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    ledgerId: {
      type: String,
      required: [true, 'Ledger ID is required'],
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['PAYABLE', 'RECEIVABLE', 'EXPENSE'],
      required: [true, 'Ledger type is required']
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Date is required']
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      // Dynamic reference - can be Brand for payables, Customer for receivables
      // No ref defined here as it's dynamic
      default: null
    },
    accountDetails: {
      type: String,
      required: [true, 'Account details are required'],
      trim: true,
      maxlength: [200, 'Account details cannot exceed 200 characters']
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    // Financial fields
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
    expense: {
      type: Number,
      default: 0,
      min: [0, 'Expense amount cannot be negative']
    },
    // Source tracking
    sourceType: {
      type: String,
      enum: ['INVENTORY', 'INVOICE', 'MANUAL'],
      required: [true, 'Source type is required']
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Dynamic reference to either Inventory or Invoice
      default: null
    },
    // Status and meta
    isActive: {
      type: Boolean,
      default: true
    },
    isManuallyEdited: {
      type: Boolean,
      default: false
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add pagination plugin
ledgerSchema.plugin(mongoosePaginate);

// Virtual for total amount based on type
ledgerSchema.virtual('totalAmount').get(function() {
  if (this.type === 'EXPENSE') {
    return this.expense;
  } else {
    return this.cash + this.credit;
  }
});

// Enhanced indexing for performance
// Text search index
ledgerSchema.index({ 
  ledgerId: "text", 
  accountDetails: "text", 
  remarks: "text"
});

// Compound indexes for common query patterns
ledgerSchema.index({ type: 1, date: -1, isActive: 1 });
ledgerSchema.index({ accountId: 1, type: 1, isActive: 1 });
ledgerSchema.index({ sourceType: 1, sourceId: 1 });
ledgerSchema.index({ isActive: 1, createdAt: -1 });
ledgerSchema.index({ date: -1, isActive: 1 });
ledgerSchema.index({ type: 1, isActive: 1 });

// Methods for calculations
ledgerSchema.statics.getTotalsByType = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        totalCash: { $sum: '$cash' },
        totalCredit: { $sum: '$credit' },
        totalExpense: { $sum: '$expense' },
        count: { $sum: 1 }
      }
    }
  ]);
};

ledgerSchema.statics.getFinancialSummary = async function() {
  const totals = await this.getTotalsByType();
  
  let payables = 0, receivables = 0, expenses = 0;
  
  totals.forEach(item => {
    if (item._id === 'PAYABLE') {
      payables = item.totalCash + item.totalCredit;
    } else if (item._id === 'RECEIVABLE') {
      receivables = item.totalCash + item.totalCredit;
    } else if (item._id === 'EXPENSE') {
      expenses = item.totalExpense;
    }
  });
  
  const balance = receivables - payables - expenses;
  
  return {
    totalPayables: payables,
    totalReceivables: receivables,
    totalExpenses: expenses,
    balance: balance,
    details: totals
  };
};

module.exports = mongoose.model("Ledger", ledgerSchema);
