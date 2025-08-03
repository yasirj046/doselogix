const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const subAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sub-area name is required'],
      trim: true,
      minlength: [2, 'Sub-area name must be at least 2 characters'],
      maxlength: [100, 'Sub-area name cannot exceed 100 characters']
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: [true, 'Area is required for sub-area']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

// Add pagination plugin
subAreaSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance optimization
// Text search index for name
subAreaSchema.index({ name: "text" });

// Compound unique index - subarea name must be unique within an area
subAreaSchema.index({ name: 1, area: 1 }, { unique: true });

// Single field indexes
subAreaSchema.index({ area: 1 });
subAreaSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SubArea", subAreaSchema);
