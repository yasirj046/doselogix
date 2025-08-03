const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const invoiceProductSchema = new mongoose.Schema({
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
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  expiry: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  availableStock: {
    type: Number,
    required: [true, 'Available stock is required'],
    min: [0, 'Available stock cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: function(value) {
        return value <= this.availableStock;
      },
      message: 'Quantity cannot exceed available stock'
    }
  },
  bonus: {
    type: Number,
    default: 0,
    min: [0, 'Bonus pieces cannot be negative']
  },
  lessToMinimum: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  minimumPrice: {
    type: Number,
    required: [true, 'Minimum price is required'],
    min: [0, 'Minimum price cannot be negative']
  },
  percentageDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  flatDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Flat discount cannot be negative']
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: [0, 'Total quantity cannot be negative']
  },
  effectiveCostPerPiece: {
    type: Number,
    required: true,
    min: [0, 'Effective cost per piece cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  }
});

const invoiceSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    invoiceId: {
      type: String,
      required: true,
      unique: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Date is required']
    },
    // Customer Information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required']
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    license: {
      type: String,
      required: [true, 'License is required'],
      trim: true
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry is required']
    },
    lastInvoice: {
      type: String,
      trim: true,
      default: null
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    // Employee Assignment
    deliverBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Delivery person is required'],
      validate: {
        validator: async function(value) {
          const Employee = mongoose.model('Employee');
          const employee = await Employee.findById(value);
          return employee && employee.role === 'driver';
        },
        message: 'Delivery person must be a driver'
      }
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Booking person is required'],
      validate: {
        validator: async function(value) {
          const Employee = mongoose.model('Employee');
          const employee = await Employee.findById(value);
          return employee && employee.role === 'salesman';
        },
        message: 'Booking person must be a salesman'
      }
    },
    deliveryLog: {
      type: String,
      required: true,
      trim: true
    },
    // Products
    products: {
      type: [invoiceProductSchema],
      required: [true, 'At least one product is required'],
      validate: {
        validator: function(products) {
          return products && products.length > 0;
        },
        message: 'At least one product must be added'
      }
    },
    // Footer Totals
    subTotal: {
      type: Number,
      required: true,
      min: [0, 'Sub total cannot be negative']
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Total discount cannot be negative']
    },
    grandTotal: {
      type: Number,
      required: true,
      min: [0, 'Grand total cannot be negative']
    },
    // Payment Information
    cashReceived: {
      type: Number,
      default: 0,
      min: [0, 'Cash received cannot be negative']
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
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    // Ledger Integration
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
invoiceSchema.plugin(mongoosePaginate);

// Pre-save middleware for calculations
invoiceSchema.pre('save', async function(next) {
  try {
    // Calculate product-level amounts
    if (this.products && this.products.length > 0) {
      this.products.forEach(product => {
        // Calculate total quantity (quantity + bonus)
        product.totalQuantity = product.quantity + (product.bonus || 0);
        
        // Calculate total amount (only quantity is charged, bonus is free)
        let amount = product.quantity * product.price;
        
        // Apply discounts (interconnected percentage and flat)
        if (product.percentageDiscount > 0) {
          const discountAmount = (amount * product.percentageDiscount) / 100;
          product.flatDiscount = discountAmount;
          amount -= discountAmount;
        } else if (product.flatDiscount > 0) {
          product.percentageDiscount = (product.flatDiscount / (product.quantity * product.price)) * 100;
          amount -= product.flatDiscount;
        }
        
        product.totalAmount = amount;
        
        // Calculate effective cost per piece (includes bonus)
        product.effectiveCostPerPiece = product.totalQuantity > 0 ? 
          product.totalAmount / product.totalQuantity : 0;
      });
    }
    
    // Calculate footer totals
    this.subTotal = this.products.reduce((sum, product) => sum + product.totalAmount, 0);
    this.grandTotal = this.subTotal - (this.totalDiscount || 0);
    
    // Calculate payment status and credit amount
    if (this.grandTotal !== undefined) {
      // Auto-calculate credit amount if not set
      if (this.cashReceived !== undefined && this.creditAmount === 0) {
        this.creditAmount = Math.max(0, this.grandTotal - this.cashReceived);
      }
      
      // Calculate payment status
      const totalReceived = this.cashReceived || 0;
      if (totalReceived >= this.grandTotal) {
        this.paymentStatus = 'fully_paid';
      } else if (totalReceived > 0) {
        this.paymentStatus = 'partially_paid';
      } else {
        this.paymentStatus = 'unpaid';
      }
    }
    
    // Generate delivery log if not provided
    if (!this.deliveryLog && this.deliverBy) {
      const Employee = mongoose.model('Employee');
      const driver = await Employee.findById(this.deliverBy);
      if (driver && driver.area) {
        // Format: AREA-DRIVER-DATE-SEQUENCE
        const dateStr = this.date.toISOString().slice(0, 10).replace(/-/g, '');
        this.deliveryLog = `${driver.area}-${driver.name.replace(/\s+/g, '')}-${dateStr}`;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Enhanced indexing for performance
// Text search index
invoiceSchema.index({ 
  invoiceId: "text", 
  customerName: "text", 
  license: "text",
  remarks: "text"
});

// Compound indexes for common query patterns
invoiceSchema.index({ customerId: 1, date: -1, isActive: 1 });
invoiceSchema.index({ isActive: 1, createdAt: -1 });
invoiceSchema.index({ date: -1, isActive: 1 });
invoiceSchema.index({ deliverBy: 1, date: -1, isActive: 1 });
invoiceSchema.index({ bookedBy: 1, date: -1, isActive: 1 });
invoiceSchema.index({ 'products.productId': 1, isActive: 1 });
invoiceSchema.index({ 'products.batchNumber': 1, isActive: 1 });
invoiceSchema.index({ paymentStatus: 1, isActive: 1 });
invoiceSchema.index({ ledgerEntryId: 1 });
invoiceSchema.index({ paymentDate: -1, isActive: 1 });
invoiceSchema.index({ license: 1, isActive: 1 });
invoiceSchema.index({ licenseExpiry: 1, isActive: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
