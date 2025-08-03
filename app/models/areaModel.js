const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ALL_CITIES } = require("../constants/cities");

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
      minlength: [2, 'Area name must be at least 2 characters'],
      maxlength: [100, 'Area name cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: {
        values: ALL_CITIES,
        message: 'Invalid city selected'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

// Add pagination plugin
areaSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance optimization
// Text search index for name
areaSchema.index({ name: "text" });

// Compound unique index - area name must be unique within a city
areaSchema.index({ name: 1, city: 1 }, { unique: true });

// Single field indexes
areaSchema.index({ city: 1 });
areaSchema.index({ createdAt: -1 });

// Virtual for subareas
areaSchema.virtual('subAreas', {
  ref: 'SubArea',
  localField: '_id',
  foreignField: 'area'
});

module.exports = mongoose.model("Area", areaSchema);
