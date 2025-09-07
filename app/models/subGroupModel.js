const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const subGroupSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to group
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
      index: true
    },
    
    // Sub group information
    subGroupName: {
      type: String,
      required: [true, 'Sub group name is required'],
      trim: true,
      maxlength: [200, 'Sub group name cannot exceed 200 characters']
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
subGroupSchema.plugin(mongoosePaginate);

// Add indexes for better performance
subGroupSchema.index({ vendorId: 1, groupId: 1 });
subGroupSchema.index({ groupId: 1, subGroupName: 1 });

// Add unique compound index to prevent duplicate sub group names for the same group and vendor
subGroupSchema.index({ vendorId: 1, groupId: 1, subGroupName: 1 }, { unique: true });

// Add text index for search functionality
subGroupSchema.index({ subGroupName: "text" });

// Virtual for full sub group name with group
subGroupSchema.virtual('fullSubGroupName').get(function() {
  return `${this.subGroupName}`;
});

module.exports = mongoose.model("SubGroup", subGroupSchema);
