const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const salesProductSchema = new mongoose.Schema(
  {
    // Reference to sales invoice
    salesInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesInvoice',
      required: [true, 'Sales invoice ID is required'],
      index: true
    },
    
    // Reference to product
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to inventory (for tracking stock deduction)
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory ID is required'],
      index: true
    },
    
    // Product details at time of sale
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      maxlength: [100, 'Batch number cannot exceed 100 characters']
    },
    
    expiry: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    
    // Stock information at time of sale
    availableStock: {
      type: Number,
      required: [true, 'Available stock is required'],
      min: [0, 'Available stock cannot be negative']
    },
    
    // Quantity details
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'Bonus cannot be negative']
    },
    
    // Return details (quantity returned against this sales product)
    returnQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Return quantity cannot be negative']
    },

    returnDate: {
      type: Date,
      required: false
    },

    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Total quantity cannot be negative']
    },
    
    // Pricing controls
    lessToMinimumCheck: {
      type: Boolean,
      default: false // if true, allows sale below minimum price
    },
    
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    
    // Discount details
    percentageDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Percentage discount cannot be negative'],
      max: [100, 'Percentage discount cannot exceed 100%']
    },
    
    flatDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Flat discount cannot be negative']
    },
    
    // Calculated fields
    effectiveCostPerPiece: {
      type: Number,
      required: [true, 'Effective cost per piece is required'],
      min: [0, 'Effective cost per piece cannot be negative']
    },
    
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    
    // Reference pricing for validation
    originalSalePrice: {
      type: Number,
      required: [true, 'Original sale price is required'],
      min: [0, 'Original sale price cannot be negative']
    },
    
    minSalePrice: {
      type: Number,
      required: [true, 'Minimum sale price is required'],
      min: [0, 'Minimum sale price cannot be negative']
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
salesProductSchema.plugin(mongoosePaginate);

// Add indexes for better performance
salesProductSchema.index({ salesInvoiceId: 1 });
salesProductSchema.index({ productId: 1 });
salesProductSchema.index({ vendorId: 1 });
salesProductSchema.index({ inventoryId: 1 });
salesProductSchema.index({ vendorId: 1, productId: 1 });
salesProductSchema.index({ vendorId: 1, batchNumber: 1 });
salesProductSchema.index({ vendorId: 1, expiry: 1 });

// Virtual for gross amount (before discount)
salesProductSchema.virtual('grossAmount').get(function() {
  return this.quantity * this.price;
});

// Virtual for discount amount
salesProductSchema.virtual('discountAmount').get(function() {
  const grossAmount = this.grossAmount;
  const percentageDiscountAmount = (grossAmount * this.percentageDiscount) / 100;
  return percentageDiscountAmount + this.flatDiscount;
});

// Virtual for net amount after discount
salesProductSchema.virtual('netAmount').get(function() {
  return this.grossAmount - this.discountAmount;
});

// Virtual to check if selling below minimum price
salesProductSchema.virtual('isBelowMinPrice').get(function() {
  return this.price < this.minSalePrice;
});

// Pre-save validation
salesProductSchema.pre('save', function(next) {
  // Check if selling below minimum price without permission
  if (this.price < this.minSalePrice && !this.lessToMinimumCheck) {
    return next(new Error(`Cannot sell below minimum price of ${this.minSalePrice} without permission`));
  }

  // Calculate effective quantity after returns (don't modify stored quantity)
  const effectiveQuantity = this.quantity - (this.returnQuantity || 0);

  // Ensure return quantity doesn't exceed sold quantity
  if (this.returnQuantity && this.returnQuantity > this.quantity) {
    return next(new Error(`Return quantity (${this.returnQuantity}) cannot exceed sold quantity (${this.quantity})`));
  }

  // Calculate total quantity (effective quantity + bonus)
  this.totalQuantity = effectiveQuantity + this.bonus;

  // Calculate total amount based on effective quantity (after returns)
  const grossAmount = effectiveQuantity * this.price;
  const percentageDiscountAmount = (grossAmount * this.percentageDiscount) / 100;
  const totalDiscountAmount = percentageDiscountAmount + this.flatDiscount;
  this.totalAmount = grossAmount - totalDiscountAmount;

  // Calculate effective cost per piece
  if (this.totalQuantity > 0) {
    this.effectiveCostPerPiece = this.totalAmount / this.totalQuantity;
  }

  next();
});

// Static method to get sales by product
salesProductSchema.statics.getSalesByProduct = async function(productId, vendorId, options = {}) {
  let query = { productId, vendorId };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.batchNumber) {
    query.batchNumber = options.batchNumber;
  }
  
  if (options.startDate && options.endDate) {
    query.createdAt = { $gte: options.startDate, $lte: options.endDate };
  }
  
  return await this.find(query)
    .populate('productId', 'productName packingSize cartonSize')
    .populate('salesInvoiceId', 'date deliveryLogNumber salesInvoiceNumber')
    .sort({ createdAt: -1 });
};

// Static method to get sales by batch
salesProductSchema.statics.getSalesByBatch = async function(batchNumber, vendorId, options = {}) {
  let query = { batchNumber, vendorId };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.productId) {
    query.productId = options.productId;
  }
  
  return await this.find(query)
    .populate('productId', 'productName packingSize cartonSize')
    .populate('salesInvoiceId', 'date deliveryLogNumber customerId salesInvoiceNumber')
    .sort({ createdAt: -1 });
};

// Static method to get expiring products sold
salesProductSchema.statics.getExpiringSalesProducts = async function(vendorId, daysFromNow = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);
  
  return await this.find({
    vendorId,
    isActive: true,
    expiry: { $lte: futureDate }
  })
  .populate('productId', 'productName')
  .populate('salesInvoiceId', 'date customerId deliveryLogNumber salesInvoiceNumber')
  .sort({ expiry: 1 });
};

// Static method to get sales history for a specific batch
salesProductSchema.statics.getBatchSalesHistory = async function(productId, vendorId, batchNumber) {
  return await this.find({ productId, vendorId, batchNumber, isActive: true })
    .populate('productId', 'productName packingSize cartonSize')
    .populate('salesInvoiceId', 'date deliveryLogNumber customerId salesInvoiceNumber');
};

module.exports = mongoose.model("SalesProduct", salesProductSchema);
