const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const groupSchema = new mongoose.Schema(
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
    
    // Group information
    group: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [200, 'Group name cannot exceed 200 characters']
    },
    
    subGroup: {
      type: String,
      required: [true, 'Sub group is required'],
      trim: true,
      maxlength: [200, 'Sub group cannot exceed 200 characters']
    },
    
    // Status
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
groupSchema.plugin(mongoosePaginate);

// Add indexes for better performance
groupSchema.index({ vendorId: 1, brandId: 1 });
groupSchema.index({ vendorId: 1, group: 1 });
groupSchema.index({ group: "text", subGroup: "text" });

// Compound unique index to prevent duplicate group-subgroup combinations for the same vendor and brand
groupSchema.index({ vendorId: 1, brandId: 1, group: 1, subGroup: 1 }, { unique: true });

// Virtual for full group name
groupSchema.virtual('fullGroupName').get(function() {
  return `${this.group} - ${this.subGroup}`;
});

// Static method to find groups by vendor
groupSchema.statics.findGroupsByVendor = async function(vendorId, options = {}) {
  const query = { vendorId };
  
  if (typeof options.isActive === 'boolean') {
    query.isActive = options.isActive;
  }
  
  if (options.brandId) {
    query.brandId = options.brandId;
  }
  
  return await this.find(query)
    .populate('brandId', 'brandName')
    .populate('vendorId', 'vendorName vendorEmail');
};

module.exports = mongoose.model("Group", groupSchema);
