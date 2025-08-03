const mongoose = require("mongoose");

const productCounterSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  sequence: { 
    type: Number, 
    default: 0 
  }
});

// Unique index per brand
productCounterSchema.index({ brand: 1 }, { unique: true });

module.exports = mongoose.model("ProductCounter", productCounterSchema);
