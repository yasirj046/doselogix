const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name cannot exceed 100 characters']
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
groupSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance optimization
// Text search index for name
groupSchema.index({ name: "text" });

// Note: name already has unique index from unique: true field definition

// Compound indexes for common query patterns
groupSchema.index({ isActive: 1, createdAt: -1 });

// Single field indexes
groupSchema.index({ isActive: 1 });
groupSchema.index({ createdAt: -1 });

// Virtual for subgroups
groupSchema.virtual('subgroups', {
  ref: 'Subgroup',
  localField: '_id',
  foreignField: 'group'
});

module.exports = mongoose.model("Group", groupSchema);
