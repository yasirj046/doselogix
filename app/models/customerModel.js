const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { PROVINCE_ENUM } = require("../constants/provinces");
const { ALL_CITIES } = require("../constants/cities");
const { CUSTOMER_CATEGORY_ENUM } = require("../constants/customerCategories");

const customerSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    customerId: {
      type: String,
      required: true,
      unique: true
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      enum: {
        values: PROVINCE_ENUM,
        message: 'Invalid province selected'
      }
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: {
        values: ALL_CITIES,
        message: 'Invalid city selected'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [10, 'Address must be at least 10 characters'],
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CUSTOMER_CATEGORY_ENUM,
        message: 'Invalid category selected'
      }
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: [true, 'Area is required']
    },
    subArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubArea',
      required: [true, 'Sub-area is required']
    },
    contact: {
      name: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true,
        minlength: [2, 'Contact name must be at least 2 characters'],
        maxlength: [100, 'Contact name cannot exceed 100 characters']
      },
      primaryNumber: {
        type: String,
        required: [true, 'Primary contact number is required'],
        validate: {
          validator: function(v) {
            return /^\+92[0-9]{10}$/.test(v);
          },
          message: 'Primary contact must be in format +92XXXXXXXXXX'
        }
      },
      secondaryNumber: {
        type: String,
        required: false,
        validate: {
          validator: function(v) {
            return !v || /^\+92[0-9]{10}$/.test(v);
          },
          message: 'Secondary contact must be in format +92XXXXXXXXXX'
        }
      },
      cnic: {
        type: String,
        required: [true, 'CNIC is required'],
        unique: true,
        validate: {
          validator: function(v) {
            return /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(v);
          },
          message: 'CNIC must be in format XXXXX-XXXXXXX-X'
        }
      }
    },
    licenseNumber: {
      type: Number,
      required: [true, 'License number is required'],
      unique: true,
      min: [1, 'License number must be greater than 0']
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
      validate: {
        validator: function(v) {
          return v > new Date();
        },
        message: 'License expiry date must be in the future'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

// Add pagination plugin
customerSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance optimization
// Text search index for contact name and address
customerSchema.index({ 
  "contact.name": "text", 
  address: "text" 
});

// Note: customerId, contact.cnic, and licenseNumber already have unique indexes from unique: true field definitions

// Compound indexes for common query patterns
customerSchema.index({ province: 1, isActive: 1 });
customerSchema.index({ city: 1, isActive: 1 });
customerSchema.index({ category: 1, isActive: 1 });
customerSchema.index({ area: 1, isActive: 1 });
customerSchema.index({ subArea: 1, isActive: 1 });
customerSchema.index({ isActive: 1, createdAt: -1 });
customerSchema.index({ province: 1, city: 1, isActive: 1 });
customerSchema.index({ area: 1, subArea: 1, isActive: 1 });

// Single field indexes
customerSchema.index({ province: 1 });
customerSchema.index({ city: 1 });
customerSchema.index({ category: 1 });
customerSchema.index({ area: 1 });
customerSchema.index({ subArea: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ licenseExpiry: 1 });
customerSchema.index({ createdAt: -1 });

// Custom validation for subArea-area relationship
customerSchema.pre('save', async function(next) {
  if (this.subArea && this.area) {
    const SubArea = mongoose.model('SubArea');
    const subArea = await SubArea.findById(this.subArea);
    
    if (!subArea) {
      return next(new Error('Invalid sub-area'));
    }
    
    if (!subArea.area.equals(this.area)) {
      return next(new Error('Sub-area does not belong to the selected area'));
    }
  }
  
  next();
});

// Custom validation for city-province relationship
customerSchema.pre('save', function(next) {
  const { CITIES } = require("../constants/cities");
  
  if (this.isModified('city') || this.isModified('province')) {
    const provinceCities = CITIES[this.province];
    if (!provinceCities || !provinceCities[this.city]) {
      return next(new Error(`City ${this.city} is not valid for province ${this.province}`));
    }
  }
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
