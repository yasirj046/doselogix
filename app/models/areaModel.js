const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const areaSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Area information
    area: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
      maxlength: [200, 'Area name cannot exceed 200 characters']
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
areaSchema.plugin(mongoosePaginate);

// Add unique compound index to prevent duplicate area names for the same vendor
areaSchema.index({ vendorId: 1, area: 1 }, { unique: true });

// Add text index for search functionality
areaSchema.index({ area: "text" });

// Virtual for full area name
areaSchema.virtual('fullAreaName').get(function() {
  return `${this.area}`;
});

module.exports = mongoose.model("Area", areaSchema);
