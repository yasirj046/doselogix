const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const subAreaSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Reference to area
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: [true, 'Area ID is required'],
      index: true
    },
    
    // Sub area information
    subAreaName: {
      type: String,
      required: [true, 'Sub area name is required'],
      trim: true,
      maxlength: [200, 'Sub area name cannot exceed 200 characters']
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
subAreaSchema.plugin(mongoosePaginate);

// Add indexes for better performance
subAreaSchema.index({ vendorId: 1, areaId: 1 });
subAreaSchema.index({ areaId: 1, subAreaName: 1 });

// Add unique compound index to prevent duplicate sub area names for the same area and vendor
subAreaSchema.index({ vendorId: 1, areaId: 1, subAreaName: 1 }, { unique: true });

// Add text index for search functionality
subAreaSchema.index({ subAreaName: "text" });

// Virtual to populate area name
subAreaSchema.virtual('areaDetails', {
  ref: 'Area',
  localField: 'areaId',
  foreignField: '_id',
  justOne: true
});

// Virtual for full sub area name with area
subAreaSchema.virtual('fullSubAreaName').get(function() {
  return `${this.subAreaName}`;
});

module.exports = mongoose.model("SubArea", subAreaSchema);
