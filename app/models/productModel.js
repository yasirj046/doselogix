const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to brand
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand ID is required'],
      index: true
    },
    
    // Reference to group (which contains both group and subgroup)
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
      index: true
    },
    
    // Basic product information
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    
    // Packaging information
    packingSize: {
      type: String,
      required: [true, 'Packing size is required'],
      trim: true,
      maxlength: [100, 'Packing size cannot exceed 100 characters']
    },
    
    cartonSize: {
      type: String,
      required: [true, 'Carton size is required'],
      trim: true,
      maxlength: [100, 'Carton size cannot exceed 100 characters']
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
productSchema.plugin(mongoosePaginate);

// Add indexes for better performance
productSchema.index({ vendorId: 1, brandId: 1 });
productSchema.index({ vendorId: 1, groupId: 1 });
productSchema.index({ productName: "text" });
productSchema.index({ vendorId: 1, isActive: 1 });

// Compound unique index to prevent duplicate product names for the same vendor, brand, and group
productSchema.index({ vendorId: 1, brandId: 1, groupId: 1, productName: 1 }, { unique: true });

// Virtual for full product display name
productSchema.virtual('fullProductName').get(function() {
  return `${this.productName} (${this.packingSize})`;
});

// Static method to find products by vendor
productSchema.statics.findProductsByVendor = async function(vendorId, options = {}) {
  const query = { vendorId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.brandId) {
    query.brandId = options.brandId;
  }
  
  if (options.groupId) {
    query.groupId = options.groupId;
  }
  
  return await this.find(query)
    .populate('brandId', 'brandName')
    .populate('groupId', 'group subGroup')
    .populate('vendorId', 'vendorName vendorEmail');
};

// Static method to find products by brand
productSchema.statics.findProductsByBrand = async function(vendorId, brandId, options = {}) {
  const query = { vendorId, brandId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.groupId) {
    query.groupId = options.groupId;
  }
  
  return await this.find(query)
    .populate('brandId', 'brandName')
    .populate('groupId', 'group subGroup')
    .populate('vendorId', 'vendorName vendorEmail');
};

// Static method to find products by group
productSchema.statics.findProductsByGroup = async function(vendorId, groupId, options = {}) {
  const query = { vendorId, groupId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.brandId) {
    query.brandId = options.brandId;
  }
  
  return await this.find(query)
    .populate('brandId', 'brandName')
    .populate('groupId', 'group subGroup')
    .populate('vendorId', 'vendorName vendorEmail');
};

module.exports = mongoose.model("Product", productSchema);
