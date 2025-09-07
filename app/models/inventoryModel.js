const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const inventorySchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to product (no duplicate product name requirement)
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    
    // Batch details
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
    
    // Stock quantities
    currentQuantity: {
      type: Number,
      required: [true, 'Current quantity is required'],
      min: [0, 'Current quantity cannot be negative'],
      default: 0
    },
    
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    
    // Pricing information
    lastPurchasePrice: {
      type: Number,
      required: [true, 'Last purchase price is required'],
      min: [0, 'Last purchase price cannot be negative']
    },
    
    averageCost: {
      type: Number,
      required: [true, 'Average cost is required'],
      min: [0, 'Average cost cannot be negative']
    },
    
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
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add pagination plugin
inventorySchema.plugin(mongoosePaginate);

// Add indexes for better performance
inventorySchema.index({ vendorId: 1, productId: 1 });
inventorySchema.index({ vendorId: 1, batchNumber: 1 });
inventorySchema.index({ vendorId: 1, expiryDate: 1 });
inventorySchema.index({ vendorId: 1, isActive: 1 });
inventorySchema.index({ vendorId: 1, currentQuantity: 1 });
inventorySchema.index({ productId: 1 });

// Compound unique index for batch per product per vendor
inventorySchema.index({ vendorId: 1, productId: 1, batchNumber: 1 }, { unique: true });

// Virtual for available quantity
inventorySchema.virtual('availableQuantity').get(function() {
  return this.currentQuantity - this.reservedQuantity;
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.currentQuantity === 0) return 'Out of Stock';
  if (this.currentQuantity <= 10) return 'Low Stock';
  if (this.availableQuantity === 0) return 'Reserved';
  return 'In Stock';
});

// Virtual for days to expiry
inventorySchema.virtual('daysToExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for expiry status
inventorySchema.virtual('expiryStatus').get(function() {
  const days = this.daysToExpiry;
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  if (days <= 90) return 'Near Expiry';
  return 'Valid';
});

// Pre-save middleware to update lastUpdated
inventorySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find inventory by product
inventorySchema.statics.findByProduct = async function(productId, vendorId, options = {}) {
  const query = { productId, vendorId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.batchNumber) {
    query.batchNumber = options.batchNumber;
  }
  
  if (options.minQuantity !== undefined) {
    query.currentQuantity = { $gte: options.minQuantity };
  }
  
  if (options.maxQuantity !== undefined) {
    query.currentQuantity = { ...query.currentQuantity, $lte: options.maxQuantity };
  }
  
  return await this.find(query)
    .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
    .sort({ expiryDate: 1 });
};

// Static method to find low stock items
inventorySchema.statics.findLowStock = async function(vendorId, threshold = 10) {
  return await this.find({
    vendorId,
    currentQuantity: { $lte: threshold, $gt: 0 },
    isActive: true
  })
    .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
    .sort({ currentQuantity: 1 });
};

// Static method to find out of stock items
inventorySchema.statics.findOutOfStock = async function(vendorId) {
  return await this.find({
    vendorId,
    currentQuantity: 0,
    isActive: true
  })
    .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
    .sort({ updatedAt: -1 });
};

// Static method to find expiring products
inventorySchema.statics.findExpiringProducts = async function(vendorId, daysFromNow = 90) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  
  return await this.find({
    vendorId,
    expiryDate: { $lte: expiryDate },
    currentQuantity: { $gt: 0 },
    isActive: true
  })
    .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
    .sort({ expiryDate: 1 });
};

// Static method to find expired products
inventorySchema.statics.findExpiredProducts = async function(vendorId) {
  const today = new Date();
  
  return await this.find({
    vendorId,
    expiryDate: { $lt: today },
    currentQuantity: { $gt: 0 },
    isActive: true
  })
    .populate('productId', 'productName packingSize cartonSize brandId groupId subGroupId')
    .sort({ expiryDate: 1 });
};

// Static method to get inventory summary
inventorySchema.statics.getInventorySummary = async function(vendorId) {
  const summary = await this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), isActive: true } },
    {
      $group: {
        _id: null,
        totalProducts: { $addToSet: '$productId' },
        totalBatches: { $sum: 1 },
        totalQuantity: { $sum: '$currentQuantity' },
        totalReserved: { $sum: '$reservedQuantity' },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ['$currentQuantity', 10] }, 1, 0]
          }
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $eq: ['$currentQuantity', 0] }, 1, 0]
          }
        },
        expiringSoonCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ['$currentQuantity', 0] },
                  { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        totalProducts: { $size: '$totalProducts' },
        totalBatches: 1,
        totalQuantity: 1,
        totalReserved: 1,
        availableQuantity: { $subtract: ['$totalQuantity', '$totalReserved'] },
        lowStockCount: 1,
        outOfStockCount: 1,
        expiringSoonCount: 1
      }
    }
  ]);
  
  return summary.length > 0 ? summary[0] : {
    totalProducts: 0,
    totalBatches: 0,
    totalQuantity: 0,
    totalReserved: 0,
    availableQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringSoonCount: 0
  };
};

// Static method to get inventory value
inventorySchema.statics.getInventoryValue = async function(vendorId) {
  const value = await this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), isActive: true } },
    {
      $group: {
        _id: null,
        totalValueByCost: { $sum: { $multiply: ['$currentQuantity', '$averageCost'] } },
        totalValueBySale: { $sum: { $multiply: ['$currentQuantity', '$salePrice'] } },
        totalValueByRetail: { $sum: { $multiply: ['$currentQuantity', '$retailPrice'] } }
      }
    }
  ]);
  
  return value.length > 0 ? value[0] : {
    totalValueByCost: 0,
    totalValueBySale: 0,
    totalValueByRetail: 0
  };
};

// Static method to reserve stock
inventorySchema.statics.reserveStock = async function(productId, vendorId, batchNumber, quantity) {
  const inventory = await this.findOne({ productId, vendorId, batchNumber, isActive: true });
  
  if (!inventory) {
    throw new Error('Inventory item not found');
  }
  
  if (inventory.availableQuantity < quantity) {
    throw new Error('Insufficient available quantity');
  }
  
  inventory.reservedQuantity += quantity;
  await inventory.save();
  
  return inventory;
};

// Static method to release reserved stock
inventorySchema.statics.releaseReservedStock = async function(productId, vendorId, batchNumber, quantity) {
  const inventory = await this.findOne({ productId, vendorId, batchNumber, isActive: true });
  
  if (!inventory) {
    throw new Error('Inventory item not found');
  }
  
  if (inventory.reservedQuantity < quantity) {
    throw new Error('Insufficient reserved quantity');
  }
  
  inventory.reservedQuantity -= quantity;
  await inventory.save();
  
  return inventory;
};

// Static method to update stock quantity
inventorySchema.statics.updateStock = async function(productId, vendorId, batchNumber, quantityChange, operation = 'add') {
  const inventory = await this.findOne({ productId, vendorId, batchNumber, isActive: true });
  
  if (!inventory) {
    throw new Error('Inventory item not found');
  }
  
  if (operation === 'add') {
    inventory.currentQuantity += quantityChange;
  } else if (operation === 'subtract') {
    if (inventory.availableQuantity < quantityChange) {
      throw new Error('Insufficient available quantity');
    }
    inventory.currentQuantity -= quantityChange;
  } else {
    throw new Error('Invalid operation. Use "add" or "subtract"');
  }
  
  await inventory.save();
  return inventory;
};

module.exports = mongoose.model("Inventory", inventorySchema);
