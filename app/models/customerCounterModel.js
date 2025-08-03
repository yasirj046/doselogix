const mongoose = require("mongoose");

const customerCounterSchema = new mongoose.Schema({
  city: { 
    type: String, 
    required: true 
  },
  sequence: { 
    type: Number, 
    default: 0 
  }
});

// Unique index per city to ensure separate counters for each city
customerCounterSchema.index({ city: 1 }, { unique: true });

module.exports = mongoose.model("CustomerCounter", customerCounterSchema);
