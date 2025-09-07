const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { PROVINCE_ENUM } = require("../constants/provinces");
const { ALL_CITIES } = require("../constants/cities");
const { CUSTOMER_CATEGORY_ENUM } = require("../constants/customerCategories");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userCustomersSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Basic customer information
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [200, 'Customer name cannot exceed 200 characters']
    },
    
    // Location information
    customerProvince: {
      type: String,
      required: [true, 'Customer province is required'],
      enum: {
        values: PROVINCE_ENUM,
        message: 'Invalid province selected'
      }
    },
    customerCity: {
      type: String,
      required: [true, 'Customer city is required'],
      enum: {
        values: ALL_CITIES,
        message: 'Invalid city selected'
      }
    },
    customerAddress: {
      type: String,
      required: [true, 'Customer address is required'],
      trim: true,
      maxlength: [500, 'Customer address cannot exceed 500 characters']
    },
    
    // Business classification
    customerCategory: {
      type: String,
      required: [true, 'Customer category is required'],
      enum: {
        values: CUSTOMER_CATEGORY_ENUM,
        message: 'Invalid customer category selected'
      }
    },
    customerArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: [true, 'Customer area is required'],
      index: true
    },
    customerSubArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubArea',
      index: true
    },
    
    // Contact information
    customerPrimaryContact: {
      type: String,
      required: [true, 'Primary contact is required'],
      trim: true,
      maxlength: [20, 'Primary contact cannot exceed 20 characters']
    },
    customerSecondaryContact: {
      type: String,
      trim: true,
      maxlength: [20, 'Secondary contact cannot exceed 20 characters']
    },
    
    // Legal information
    customerCnic: {
      type: String,
      required: [true, 'Customer CNIC is required'],
      trim: true,
    },
    customerLicenseNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'License number cannot exceed 100 characters']
    },
    customerLicenseExpiryDate: {
      type: Date
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
userCustomersSchema.plugin(mongoosePaginate);

// Add compound indexes for better performance
userCustomersSchema.index({ vendorId: 1 ,customerName: 1 }, { unique: true });
// userCustomersSchema.index({ vendorId: 1, isActive: 1 });
userCustomersSchema.index({ customerName: "text"}); //, customerCode: "text" 
// userCustomersSchema.index({ customerName: "text" });
userCustomersSchema.index({ customerProvince: 1, customerCity: 1 });
userCustomersSchema.index({ customerCategory: 1 });
userCustomersSchema.index({ customerLicenseExpiryDate: 1 });

// Configure auto-incrementing sequence
// userCustomersSchema.plugin(AutoIncrement, {
//   inc_field: 'customerSeq',
//   start_seq: 1000
// });

// Pre-save hook to generate customerCode from sequence
// userCustomersSchema.pre('save', function(next) {
//   if (this.isNew && !this.customerCode && this.customerSeq) {
//     this.customerCode = `CUST-${this.customerSeq}`;
//   }
//   next();
// });

// Virtual for customer license status
userCustomersSchema.virtual('customerLicenseStatus').get(function() {
  if (!this.customerLicenseExpiryDate) {
    return { status: 'NOT_SET', daysRemaining: null };
  }
  
  const today = new Date();
  const expiryDate = new Date(this.customerLicenseExpiryDate);
  const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  let status = 'VALID';
  if (daysRemaining < 0) {
    status = 'EXPIRED';
  } else if (daysRemaining <= 7) {
    status = 'URGENT';
  } else if (daysRemaining <= 60) {
    status = 'WARNING';
  }
  
  return { status, daysRemaining };
});

// Static method to find customers with expiring licenses
userCustomersSchema.statics.findCustomersWithExpiringLicense = async function(vendorId, daysBefore) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);
  
  const query = {
    customerLicenseExpiryDate: {
      $lte: targetDate,
      $gte: new Date()
    },
    isActive: true
  };
  
  if (vendorId) {
    query.vendorId = vendorId;
  }
  
  return await this.find(query).populate('vendorId', 'vendorName vendorEmail');
};

// Static method to find customers by vendor
userCustomersSchema.statics.findCustomersByVendor = async function(vendorId, options = {}) {
  const query = { vendorId, isActive: true };
  
  if (options.customerCategory) {
    query.customerCategory = options.customerCategory;
  }
  
  if (options.customerProvince) {
    query.customerProvince = options.customerProvince;
  }
  
  if (options.customerCity) {
    query.customerCity = options.customerCity;
  }
  
  return await this.find(query).populate('vendorId', 'vendorName vendorEmail');
};

module.exports = mongoose.model("UserCustomers", userCustomersSchema); 