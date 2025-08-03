const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    productId: {
      type: String,
      required: true,
      unique: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    packing: {
      type: Number,
      required: [true, 'Packing is required'],
      min: [1, 'Packing must be at least 1'],
      max: [10000, 'Packing cannot exceed 10,000']
    },
    cartonSize: {
      type: Number,
      required: [true, 'Carton size is required'],
      min: [1, 'Carton size must be at least 1'],
      max: [10000, 'Carton size cannot exceed 10,000']
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: false
    },
    subgroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subgroup',
      required: false
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
productSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance
// Note: productId already has unique index from unique: true field definition

// Text search index for product name
productSchema.index({ name: "text" });

// Compound indexes for common query patterns
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ group: 1, isActive: 1 });
productSchema.index({ subgroup: 1, isActive: 1 });
productSchema.index({ brand: 1, group: 1, isActive: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// Single field indexes
productSchema.index({ brand: 1 });
productSchema.index({ group: 1 });
productSchema.index({ subgroup: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ packing: 1 });
productSchema.index({ cartonSize: 1 });

// Custom validation for subgroup-group relationship
productSchema.pre('save', async function(next) {
  if (this.subgroup && !this.group) {
    return next(new Error('Group is required when subgroup is specified'));
  }
  
  if (this.subgroup && this.group) {
    const Subgroup = mongoose.model('Subgroup');
    const subgroup = await Subgroup.findById(this.subgroup);
    
    if (!subgroup) {
      return next(new Error('Invalid subgroup'));
    }
    
    if (!subgroup.group.equals(this.group)) {
      return next(new Error('Subgroup does not belong to the selected group'));
    }
  }
  
  next();
});

module.exports = mongoose.model("Product", productSchema);
