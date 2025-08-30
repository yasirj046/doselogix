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
    
    subArea: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, 'Sub area cannot exceed 200 characters']
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

// Add indexes for better performance
areaSchema.index({ vendorId: 1, area: 1 });
areaSchema.index({ area: "text", subArea: "text" });

// Compound unique index to prevent duplicate area-subarea combinations for the same vendor
// areaSchema.index({ vendorId: 1, area: 1, subArea: 1 }, { unique: true });

// Virtual for full area name
areaSchema.virtual('fullAreaName').get(function() {
  return `${this.area} - ${this.subArea}`;
});

module.exports = mongoose.model("Area", areaSchema);
