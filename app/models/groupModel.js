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
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [200, 'Group name cannot exceed 200 characters']
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

// Add unique compound index to prevent duplicate group names for the same vendor and brand
groupSchema.index({ vendorId: 1, brandId: 1, groupName: 1 }, { unique: true });

// Add text index for search functionality
groupSchema.index({ groupName: "text" });

// Add indexes for better performance
groupSchema.index({ vendorId: 1, brandId: 1 });

// Virtual for full group name
groupSchema.virtual('fullGroupName').get(function() {
  return `${this.groupName}`;
});

module.exports = mongoose.model("Group", groupSchema);
