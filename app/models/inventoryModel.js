const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const inventoryProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  cartonSize: {
    type: Number,
    required: [true, 'Carton size is required'],
    min: [1, 'Carton size must be at least 1']
  },
  batches: [
    {
      batchNumber: {
        type: String,
        required: [true, 'Batch number is required'],
        trim: true
      },
      expiry: {
        type: Date,
        required: [true, 'Expiry date is required'],
        validate: {
          validator: function(value) {
            return value > new Date();
          },
          message: 'Expiry date must be in the future'
        }
      },
      cartons: {
        type: Number,
        required: [true, 'Number of cartons is required'],
        min: [0, 'Cartons cannot be negative']
      },
      pieces: {
        type: Number,
        required: [true, 'Number of pieces is required'],
        min: [0, 'Pieces cannot be negative']
      },
      bonus: {
        type: Number,
        default: 0,
        min: [0, 'Bonus pieces cannot be negative'],
      }
    }
  ],
  orderedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Ordered quantity cannot be negative']
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: [0, 'Total quantity cannot be negative']
  },
  netPrice: {
    type: Number,
    required: [true, 'Net price is required'],
    min: [0, 'Net price cannot be negative']
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  grossAmount: {
    type: Number,
    required: true,
    min: [0, 'Gross amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  effectivePricePerPiece: {
    type: Number,
    required: true,
    min: [0, 'Effective price per piece cannot be negative']
  },
  // New pricing features
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'Cost price cannot be negative']
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required'],
    min: [0, 'Sale price cannot be negative']
  },
  minSalePricePercentage: {
    type: Number,
    required: [true, 'Minimum sale price percentage is required'],
    min: [0, 'Minimum sale price percentage cannot be negative'],
    max: [100, 'Minimum sale price percentage cannot exceed 100%']
  },
  minSalePrice: {
    type: Number,
    required: true,
    min: [0, 'Minimum sale price cannot be negative']
  },
  retailPrice: {
    type: Number,
    required: [true, 'Retail price is required'],
    min: [0, 'Retail price cannot be negative']
  },
  invoicePrice: {
    type: Number,
    required: true,
    min: [0, 'Invoice price cannot be negative']
  }
});

// Pre-save middleware for automatic calculations in products
inventoryProductSchema.pre('save', function(next) {
  // Calculate cost price: orderedQuantity / netPrice
  if (this.orderedQuantity && this.netPrice) {
    this.costPrice = this.orderedQuantity / this.netPrice;
  }
  
  // Calculate minimum sale price based on cost price and percentage
  if (this.costPrice && this.minSalePricePercentage) {
    this.minSalePrice = this.costPrice * (1 + (this.minSalePricePercentage / 100));
  }
  
  // Calculate invoice price as 85% of retail price
  if (this.retailPrice) {
    this.invoicePrice = this.retailPrice * 0.85;
  }
  
  next();
});

const inventorySchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    inventoryId: {
      type: String,
      required: true,
      unique: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Date is required']
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand ID is required']
    },
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true
    },
    brandInvoice: {
      type: String,
      required: [true, 'Brand invoice number is required'],
      trim: true
    },
    brandInvoiceDate: {
      type: Date,
      required: [true, 'Brand invoice date is required']
    },
    products: {
      type: [inventoryProductSchema],
      required: [true, 'At least one product is required'],
      validate: {
        validator: function(products) {
          return products && products.length > 0;
        },
        message: 'At least one product must be added'
      }
    },
    grossTotal: {
      type: Number,
      required: true,
      min: [0, 'Gross total cannot be negative']
    },
    flatDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Flat discount cannot be negative']
    },
    specialDiscountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Special discount percentage cannot be negative'],
      max: [100, 'Special discount percentage cannot exceed 100%']
    },
    specialDiscountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Special discount amount cannot be negative']
    },
    freight: {
      type: Number,
      default: 0,
      min: [0, 'Freight cannot be negative']
    },
    grandTotal: {
      type: Number,
      required: true,
      min: [0, 'Grand total cannot be negative']
    },
    remarksForInvoice: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    // Payment Integration - PIS approach
    cashPaid: {
      type: Number,
      default: 0,
      min: [0, 'Cash paid cannot be negative']
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: [0, 'Credit amount cannot be negative']
    },
    paymentNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Payment notes cannot exceed 500 characters']
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'fully_paid'],
      default: 'unpaid'
    },
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      default: null
    },
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
inventorySchema.plugin(mongoosePaginate);

// Pre-save middleware for inventory document to handle product calculations
inventorySchema.pre('save', function(next) {
  if (this.products && this.products.length > 0) {
    this.products.forEach(product => {
      // Calculate cost price: orderedQuantity / netPrice
      if (product.orderedQuantity && product.netPrice) {
        product.costPrice = product.orderedQuantity / product.netPrice;
      }
      
      // Calculate minimum sale price based on cost price and percentage
      if (product.costPrice && product.minSalePricePercentage) {
        product.minSalePrice = product.costPrice * (1 + (product.minSalePricePercentage / 100));
      }
      
      // Calculate invoice price as 85% of retail price
      if (product.retailPrice) {
        product.invoicePrice = product.retailPrice * 0.85;
      }
    });
  }
  
  // Calculate payment status and credit amount
  if (this.grandTotal !== undefined) {
    // Auto-calculate credit amount if not set
    if (this.cashPaid !== undefined && this.creditAmount === 0) {
      this.creditAmount = Math.max(0, this.grandTotal - this.cashPaid);
    }
    
    // Calculate payment status
    const totalPaid = this.cashPaid || 0;
    if (totalPaid >= this.grandTotal) {
      this.paymentStatus = 'fully_paid';
    } else if (totalPaid > 0) {
      this.paymentStatus = 'partially_paid';
    } else {
      this.paymentStatus = 'unpaid';
    }
  }
  
  next();
});


// Enhanced indexing for better performance
// Text search index for inventory ID, brand name, and invoice
inventorySchema.index({ 
  inventoryId: "text", 
  brandName: "text", 
  brandInvoice: "text",
  remarksForInvoice: "text"
});

// Note: inventoryId already has unique index from unique: true field definition

// Compound indexes for common query patterns
inventorySchema.index({ brandId: 1, date: -1, isActive: 1 });
inventorySchema.index({ isActive: 1, createdAt: -1 });
inventorySchema.index({ date: -1, isActive: 1 });
inventorySchema.index({ brandInvoice: 1, isActive: 1 });
inventorySchema.index({ 'products.productId': 1, isActive: 1 });
// New: Index for batchNumber and expiry inside batches array
inventorySchema.index({ 'products.batches.batchNumber': 1, isActive: 1 });
inventorySchema.index({ 'products.batches.expiry': 1, isActive: 1 });
inventorySchema.index({ paymentStatus: 1, isActive: 1 });
inventorySchema.index({ ledgerEntryId: 1 });
inventorySchema.index({ paymentDate: -1, isActive: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
