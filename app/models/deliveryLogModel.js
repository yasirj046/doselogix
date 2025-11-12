const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const deliveryLogSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Date of delivery
    date: {
      type: Date,
      required: [true, 'Delivery date is required'],
      index: true
    },
    
    // Reference to salesman (employee with Salesman role)
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Salesman ID is required'],
      index: true
    },
    
    // Delivery log number (auto-generated but editable)
    deliveryLogNumber: {
      type: String,
      required: false, // Will be auto-generated in pre-save hook if not provided
      unique: true,
      trim: true,
      index: true
    },
    
    // Array of sales invoice references
    invoices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesInvoice'
    }],
    
    // Total amount (auto-calculated from all invoices)
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative']
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
    toObject: { virtuals: true },
    versionKey: false
  }
);

// Add pagination plugin
deliveryLogSchema.plugin(mongoosePaginate);

// Add compound indexes for better performance
deliveryLogSchema.index({ vendorId: 1, date: -1 });
deliveryLogSchema.index({ vendorId: 1, salesmanId: 1, date: 1 }, { unique: true }); // One log per salesman per day
deliveryLogSchema.index({ vendorId: 1, isActive: 1 });
deliveryLogSchema.index({ deliveryLogNumber: "text" });

// Pre-save hook to generate delivery log number
deliveryLogSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.deliveryLogNumber) {
      const Employee = mongoose.model('Employee');
      const salesman = await Employee.findById(this.salesmanId);
      
      if (!salesman) {
        throw new Error('Salesman not found');
      }
      
      // Use last 4 characters of employee ID as employee number
      const employeeIdStr = this.salesmanId.toString();
      const employeeCode = employeeIdStr.slice(-4);
      
      this.deliveryLogNumber = await this.constructor.generateDeliveryLogNumber(
        this.date, 
        employeeCode
      );
    } else if (this.isNew) {
      // Delivery log number already provided
    }
    
    // Ensure delivery log number is set before saving
    if (!this.deliveryLogNumber) {
      throw new Error('Delivery log number is required');
    }
    
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

// Virtual for number of invoices
deliveryLogSchema.virtual('invoiceCount').get(function() {
  return this.invoices ? this.invoices.length : 0;
});

// Virtual for formatted date
deliveryLogSchema.virtual('formattedDate').get(function() {
  return this.date ? this.date.toISOString().split('T')[0] : null;
});

// Virtual for formatted amount
deliveryLogSchema.virtual('formattedAmount').get(function() {
  return this.totalAmount ? parseFloat(this.totalAmount).toFixed(2) : '0.00';
});

// Static method to generate delivery log number
// Format: DLV-YY-MMDD-EEE
deliveryLogSchema.statics.generateDeliveryLogNumber = async function(date, employeeNumber) {
  // Ensure date is a valid Date object
  const deliveryDate = date instanceof Date ? date : new Date(date);
  
  const year = deliveryDate.getFullYear();
  const yy = (year % 100).toString().padStart(2, '0');
  const mm = (deliveryDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = deliveryDate.getDate().toString().padStart(2, '0');
  const mmdd = mm + dd;
  
  // Format employee number (pad to 4 digits)
  const empNum = employeeNumber.toString().padStart(4, '0');
  
  // Full delivery log number format
  const deliveryLogNumber = `DLV-${yy}-${mmdd}-${empNum}`;
  
  return deliveryLogNumber;
};

// Static method to find or create delivery log for a salesman on a specific date
deliveryLogSchema.statics.findOrCreateForSalesman = async function(vendorId, salesmanId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Try to find existing delivery log
  let deliveryLog = await this.findOne({
    vendorId,
    salesmanId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  
  // If not found, create new one
  if (!deliveryLog) {
    deliveryLog = await this.create({
      vendorId,
      salesmanId,
      date: startOfDay,
      invoices: [],
      totalAmount: 0
    });
  }
  
  return deliveryLog;
};

// Static method to recalculate total amount from linked invoices
deliveryLogSchema.statics.recalculateTotal = async function(deliveryLogId) {
  const SalesInvoice = mongoose.model('SalesInvoice');
  
  const deliveryLog = await this.findById(deliveryLogId).populate('invoices');
  if (!deliveryLog) {
    throw new Error('Delivery log not found');
  }
  
  // Calculate total from all active invoices
  const total = await SalesInvoice.aggregate([
    {
      $match: {
        _id: { $in: deliveryLog.invoices },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$grandTotal' }
      }
    }
  ]);
  
  const totalAmount = total.length > 0 ? total[0].totalAmount : 0;
  
  // Update delivery log
  deliveryLog.totalAmount = totalAmount;
  await deliveryLog.save();
  
  return deliveryLog;
};

// Instance method to add invoice
deliveryLogSchema.methods.addInvoice = async function(invoiceId) {
  if (!this.invoices.includes(invoiceId)) {
    this.invoices.push(invoiceId);
    await this.save();
    // Recalculate total
    await this.constructor.recalculateTotal(this._id);
  }
};

// Instance method to remove invoice
deliveryLogSchema.methods.removeInvoice = async function(invoiceId) {
  const index = this.invoices.indexOf(invoiceId);
  if (index > -1) {
    this.invoices.splice(index, 1);
    await this.save();
    // Recalculate total
    await this.constructor.recalculateTotal(this._id);
  }
};

module.exports = mongoose.model("DeliveryLog", deliveryLogSchema);
