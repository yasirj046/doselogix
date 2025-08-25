const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const brandSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Brand identification
    brandSeq: {
      type: Number,
      unique: true
    },
    brandCode: {
      type: String,
      unique: true
    },
    
    // Basic brand information
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      maxlength: [200, 'Brand name cannot exceed 200 characters']
    },
    
    // Location information
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    
    // Contact information
    primaryContact: {
      type: String,
      trim: true,
      maxlength: [20, 'Primary contact cannot exceed 20 characters']
    },
    secondaryContact: {
      type: String,
      trim: true,
      maxlength: [20, 'Secondary contact cannot exceed 20 characters']
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
brandSchema.plugin(mongoosePaginate);

// Add compound indexes for better performance
brandSchema.index({ vendorId: 1, brandCode: 1 }, { unique: true });

// Pre-save middleware to generate brandCode
brandSchema.pre('save', async function(next) {
  if (!this.brandCode) {
    this.brandCode = `BRAND-${this.brandSeq}`;
  }
  next();
});

// Static method to find brands by vendor
brandSchema.statics.findBrandsByVendor = async function(vendorId, options = {}) {
  const query = { vendorId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  return await this.find(query);
};

module.exports = mongoose.model("Brand", brandSchema); 