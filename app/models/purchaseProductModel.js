const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const purchaseProductSchema = new mongoose.Schema(
  {
    // Reference to purchase entry
    purchaseEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseEntry',
      required: [true, 'Purchase entry ID is required'],
      index: true
    },
    
    // Reference to product (no duplicate product name requirement)
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
    
    // Product details at time of purchase
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      maxlength: [100, 'Batch number cannot exceed 100 characters']
    },
    
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    
    // Quantity details
    cartons: {
      type: Number,
      required: [true, 'Cartons quantity is required'],
      min: [0, 'Cartons cannot be negative'],
      default: 0
    },
    
    pieces: {
      type: Number,
      required: [true, 'Pieces quantity is required'],
      min: [0, 'Pieces cannot be negative'],
      default: 0
    },
    
    // Calculated total quantity
    quantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'Bonus cannot be negative']
    },
    
    // Return details
    returnQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Return quantity cannot be negative']
    },
    
    returnDate: {
      type: Date
    },
    
    // Pricing details
    netPrice: {
      type: Number,
      required: [true, 'Net price is required'],
      min: [0, 'Net price cannot be negative']
    },
    
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    
    // Calculated effective cost per piece
    effectiveCostPerPiece: {
      type: Number,
      required: [true, 'Effective cost per piece is required'],
      min: [0, 'Effective cost per piece cannot be negative']
    },
    
    // Calculated total amount
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    
    // Sale pricing
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Sale price cannot be negative']
    },
    
    minSalePrice: {
      type: Number,
      required: [true, 'Minimum sale price is required'],
      min: [0, 'Minimum sale price cannot be negative']
    },
    
    retailPrice: {
      type: Number,
      required: [true, 'Retail price is required'],
      min: [0, 'Retail price cannot be negative']
    },
    
    invoicePrice: {
      type: Number,
      required: [true, 'Invoice price is required'],
      min: [0, 'Invoice price cannot be negative']
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
purchaseProductSchema.plugin(mongoosePaginate);

// Add indexes for better performance
purchaseProductSchema.index({ purchaseEntryId: 1 });
purchaseProductSchema.index({ productId: 1 });
purchaseProductSchema.index({ vendorId: 1 });
purchaseProductSchema.index({ vendorId: 1, productId: 1 });
purchaseProductSchema.index({ vendorId: 1, batchNumber: 1 });
purchaseProductSchema.index({ vendorId: 1, expiryDate: 1 });
purchaseProductSchema.index({ vendorId: 1, isActive: 1 });

// Compound unique index for batch number per product per vendor
purchaseProductSchema.index({ vendorId: 1, productId: 1, batchNumber: 1 }, { unique: true });

// Virtual for available quantity (total quantity + bonus)
purchaseProductSchema.virtual('availableQuantity').get(function() {
  return this.quantity + this.bonus;
});

// Virtual for effective quantity after returns
purchaseProductSchema.virtual('effectiveQuantity').get(function() {
  return this.quantity - this.returnQuantity;
});

// Virtual for effective available quantity (after returns + bonus)
purchaseProductSchema.virtual('effectiveAvailableQuantity').get(function() {
  return (this.quantity - this.returnQuantity) + this.bonus;
});

// Virtual for gross amount (quantity * netPrice)
purchaseProductSchema.virtual('grossAmount').get(function() {
  return this.quantity * this.netPrice;
});

// Virtual for discount amount
purchaseProductSchema.virtual('discountAmount').get(function() {
  if (this.discountType === 'percentage') {
    return this.grossAmount * (this.discount / 100);
  }
  return this.discount;
});

// Virtual for net amount (grossAmount - discountAmount)
purchaseProductSchema.virtual('netAmount').get(function() {
  return this.grossAmount - this.discountAmount;
});

// Pre-save middleware to calculate derived fields
purchaseProductSchema.pre('save', async function(next) {
  try {
    // Get the product to access cartonSize
    const Product = require('./productModel');
    const product = await Product.findById(this.productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Calculate total quantity: (cartons * cartonSize) + pieces
    this.quantity = (this.cartons * product.cartonSize) + this.pieces;
    
    // Effective quantity after returns
    const effectiveQuantity = this.quantity - this.returnQuantity;
    
    // Ensure return quantity doesn't exceed purchased quantity
    if (this.returnQuantity > this.quantity) {
      throw new Error('Return quantity cannot exceed purchased quantity');
    }
    
    // Calculate gross amount based on effective quantity (after returns)
    const grossAmount = effectiveQuantity * this.netPrice;
    
    // Calculate discount amount
    let discountAmount = 0;
    if (this.discountType === 'percentage') {
      discountAmount = grossAmount * (this.discount / 100);
    } else {
      discountAmount = this.discount;
    }
    
    // Calculate total amount
    this.totalAmount = grossAmount - discountAmount;
    
    // Calculate effective cost per piece (including bonus, excluding returns)
    const totalAvailablePieces = effectiveQuantity + this.bonus;
    this.effectiveCostPerPiece = totalAvailablePieces > 0 ? this.totalAmount / totalAvailablePieces : 0;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find purchase products by purchase entry
purchaseProductSchema.statics.findByPurchaseEntry = async function(purchaseEntryId, vendorId) {
  return await this.find({ purchaseEntryId, vendorId })
    .populate('productId', 'productName packingSize cartonSize')
    .populate('purchaseEntryId', 'invoiceNumber date')
    .sort({ createdAt: 1 });
};

// Static method to find purchase products by product
purchaseProductSchema.statics.findByProduct = async function(productId, vendorId, options = {}) {
  const query = { productId, vendorId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.batchNumber) {
    query.batchNumber = options.batchNumber;
  }
  
  if (options.expiryBefore) {
    query.expiryDate = { $lte: options.expiryBefore };
  }
  
  if (options.expiryAfter) {
    query.expiryDate = { ...query.expiryDate, $gte: options.expiryAfter };
  }
  
  return await this.find(query)
    .populate('productId', 'productName packingSize cartonSize')
    .populate('purchaseEntryId', 'invoiceNumber date brandId')
    .sort({ expiryDate: 1 });
};

// Static method to find expiring products
purchaseProductSchema.statics.findExpiringProducts = async function(vendorId, daysFromNow = 90) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  
  return await this.find({
    vendorId,
    expiryDate: { $lte: expiryDate },
    isActive: true
  })
    .populate('productId', 'productName packingSize cartonSize')
    .populate('purchaseEntryId', 'invoiceNumber date')
    .sort({ expiryDate: 1 });
};

// Static method to get product purchase history
purchaseProductSchema.statics.getProductPurchaseHistory = async function(productId, vendorId, options = {}) {
  const query = { productId, vendorId };
  
  if (options.startDate && options.endDate) {
    // Need to join with purchase entry for date filtering
    return await this.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'purchaseentries',
          localField: 'purchaseEntryId',
          foreignField: '_id',
          as: 'purchaseEntry'
        }
      },
      { $unwind: '$purchaseEntry' },
      {
        $match: {
          'purchaseEntry.date': { $gte: options.startDate, $lte: options.endDate }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          batchNumber: 1,
          expiryDate: 1,
          quantity: 1,
          bonus: 1,
          netPrice: 1,
          effectiveCostPerPiece: 1,
          salePrice: 1,
          totalAmount: 1,
          createdAt: 1,
          'purchaseEntry.invoiceNumber': 1,
          'purchaseEntry.date': 1,
          'product.productName': 1,
          'product.packingSize': 1
        }
      },
      { $sort: { 'purchaseEntry.date': -1 } }
    ]);
  }
  
  return await this.find(query)
    .populate('productId', 'productName packingSize cartonSize')
    .populate('purchaseEntryId', 'invoiceNumber date')
    .sort({ createdAt: -1 });
};

// Static method to get batch details
purchaseProductSchema.statics.getBatchDetails = async function(productId, vendorId, batchNumber) {
  return await this.findOne({ productId, vendorId, batchNumber, isActive: true })
    .populate('productId', 'productName packingSize cartonSize')
    .populate('purchaseEntryId', 'invoiceNumber date brandId');
};

module.exports = mongoose.model("PurchaseProduct", purchaseProductSchema);
