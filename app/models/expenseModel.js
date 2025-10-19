const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { EXPENSE_CATEGORY_ENUM } = require("../constants/expenseCategories");

const expenseSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Expense date
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    
    // Expense category
    expenseCategory: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
      enum: {
        values: EXPENSE_CATEGORY_ENUM,
        message: 'Please select a valid expense category'
      },
      index: true
    },
    
    // Description
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    // Amount
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: function(value) {
          return /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: 'Amount should have maximum 2 decimal places'
      }
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields automatically
    versionKey: false
  }
);

// Add indexes for better query performance
expenseSchema.index({ vendorId: 1, date: -1 });
expenseSchema.index({ vendorId: 1, expenseCategory: 1 });
expenseSchema.index({ vendorId: 1, isActive: 1 });
expenseSchema.index({ vendorId: 1, createdAt: -1 });

// Add pagination plugin
expenseSchema.plugin(mongoosePaginate);

// Pre-save middleware to ensure proper date handling
expenseSchema.pre('save', function(next) {
  if (this.date && typeof this.date === 'string') {
    this.date = new Date(this.date);
  }
  next();
});

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date ? this.date.toISOString().split('T')[0] : null;
});

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return this.amount ? parseFloat(this.amount).toFixed(2) : '0.00';
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

// Static method to get expense categories
expenseSchema.statics.getExpenseCategories = function() {
  const { EXPENSE_CATEGORIES } = require('../constants/expenseCategories');
  return EXPENSE_CATEGORIES;
};

// Static method to get total expenses by vendor
expenseSchema.statics.getTotalExpensesByVendor = async function(vendorId, startDate = null, endDate = null) {
  const matchStage = { vendorId: mongoose.Types.ObjectId(vendorId), isActive: true };
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }
  
  const result = await this.aggregate([
    { $match: matchStage },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
