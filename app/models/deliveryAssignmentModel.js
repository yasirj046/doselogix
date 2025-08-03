const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    deliveryLogNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Assignment date is required']
    },
    // Delivery Personnel
    deliverBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Delivery person is required']
    },
    deliverymanName: {
      type: String,
      required: [true, 'Deliveryman name is required'],
      trim: true
    },
    deliverymanCode: {
      type: String,
      required: [true, 'Deliveryman code is required'],
      trim: true
    },
    // Area Information
    deliveryArea: {
      type: String,
      required: [true, 'Delivery area is required'],
      trim: true
    },
    // Assignment Details
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Booking person is required']
    },
    bookedByName: {
      type: String,
      required: [true, 'Booking person name is required'],
      trim: true
    },
    // Invoice Assignment (Array of invoices under this deliveryman)
    invoices: [{
      invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
      },
      invoiceNumber: {
        type: String,
        required: true,
        trim: true
      },
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
      },
      customerName: {
        type: String,
        required: true,
        trim: true
      },
      customerArea: {
        type: String,
        trim: true
      },
      license: {
        type: String,
        trim: true
      },
      grandTotal: {
        type: Number,
        required: true,
        min: [0, 'Grand total cannot be negative']
      },
      cashReceived: {
        type: Number,
        default: 0
      },
      creditAmount: {
        type: Number,
        default: 0
      },
      paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'fully_paid'],
        required: true
      },
      assignedDate: {
        type: Date,
        default: Date.now
      },
      productCount: {
        type: Number,
        default: 0
      },
      totalQuantity: {
        type: Number,
        default: 0
      }
    }],
    // Summary Totals
    totalInvoices: {
      type: Number,
      default: 0,
      min: [0, 'Total invoices cannot be negative']
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative']
    },
    totalCashReceived: {
      type: Number,
      default: 0,
      min: [0, 'Total cash received cannot be negative']
    },
    totalCreditAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total credit amount cannot be negative']
    },
    totalProductCount: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    // System Fields
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add pagination plugin
deliveryAssignmentSchema.plugin(mongoosePaginate);

// Pre-save middleware for calculations
deliveryAssignmentSchema.pre('save', function(next) {
  try {
    // Calculate summary totals from invoices array
    if (this.invoices && this.invoices.length > 0) {
      this.totalInvoices = this.invoices.length;
      this.totalAmount = this.invoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
      this.totalCashReceived = this.invoices.reduce((sum, invoice) => sum + invoice.cashReceived, 0);
      this.totalCreditAmount = this.invoices.reduce((sum, invoice) => sum + invoice.creditAmount, 0);
      this.totalProductCount = this.invoices.reduce((sum, invoice) => sum + invoice.productCount, 0);
      this.totalQuantity = this.invoices.reduce((sum, invoice) => sum + invoice.totalQuantity, 0);
    } else {
      // Reset totals if no invoices
      this.totalInvoices = 0;
      this.totalAmount = 0;
      this.totalCashReceived = 0;
      this.totalCreditAmount = 0;
      this.totalProductCount = 0;
      this.totalQuantity = 0;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Create unique index for deliveryman per date (one record per deliveryman per day)
deliveryAssignmentSchema.index({ 
  deliverBy: 1, 
  date: 1 
}, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Enhanced indexing for performance
deliveryAssignmentSchema.index({
  deliveryLogNumber: "text",
  deliverymanName: "text",
  deliveryArea: "text",
  'invoices.customerName': "text",
  'invoices.invoiceNumber': "text"
});

// Compound indexes for common query patterns
deliveryAssignmentSchema.index({ deliverBy: 1, isActive: 1 });
deliveryAssignmentSchema.index({ date: -1, isActive: 1 });
deliveryAssignmentSchema.index({ deliveryArea: 1, date: -1, isActive: 1 });
deliveryAssignmentSchema.index({ bookedBy: 1, date: -1, isActive: 1 });
deliveryAssignmentSchema.index({ 'invoices.invoiceId': 1, isActive: 1 });
deliveryAssignmentSchema.index({ 'invoices.customerId': 1, isActive: 1 });
deliveryAssignmentSchema.index({ createdBy: 1, date: -1, isActive: 1 });

module.exports = mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);
