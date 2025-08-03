const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { PROVINCE_ENUM } = require("../constants/provinces");
const { ALL_CITIES } = require("../constants/cities");

const brandSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    brandId: { 
      type: String, 
      required: [true, 'Brand ID is required'], 
      unique: true
    },
    name: { 
      type: String, 
      required: [true, 'Brand name is required'],
      trim: true,
      minlength: [2, 'Brand name must be at least 2 characters'],
      maxlength: [200, 'Brand name cannot exceed 200 characters']
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
    primaryContact: { 
      type: String, 
      required: [true, 'Primary contact is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+92[0-9]{10}$/.test(v);
        },
        message: 'Primary contact must be in format +92XXXXXXXXXX'
      }
    },
    secondaryContact: { 
      type: String, 
      required: [true, 'Secondary contact is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+92[0-9]{10}$/.test(v);
        },
        message: 'Secondary contact must be in format +92XXXXXXXXXX'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

brandSchema.plugin(mongoosePaginate);

// Enhanced indexing for better performance
// Text search index for name, city, and province
brandSchema.index({ name: "text", city: "text", province: "text", address: "text" });

// Note: brandId already has unique index from unique: true field definition

// Compound indexes for common query patterns
brandSchema.index({ province: 1, city: 1, isActive: 1 });
brandSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Brand", brandSchema);
