const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const subgroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subgroup name is required'],
      trim: true,
      minlength: [2, 'Subgroup name must be at least 2 characters'],
      maxlength: [100, 'Subgroup name cannot exceed 100 characters']
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group is required for subgroup']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

// Add pagination plugin
subgroupSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance optimization
// Text search index for name
subgroupSchema.index({ name: "text" });

// Compound unique index - subgroup name must be unique within a group
subgroupSchema.index({ name: 1, group: 1 }, { unique: true });

// Compound indexes for common query patterns
subgroupSchema.index({ group: 1, isActive: 1 });
subgroupSchema.index({ isActive: 1, createdAt: -1 });

// Single field indexes
subgroupSchema.index({ group: 1 });
subgroupSchema.index({ isActive: 1 });
subgroupSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Subgroup", subgroupSchema);
