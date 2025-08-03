const mongoose = require("mongoose");

const ledgerCounterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PAYABLE', 'RECEIVABLE', 'EXPENSE'],
      required: [true, 'Counter type is required'],
      unique: true
    },
    prefix: {
      type: String,
      required: [true, 'Prefix is required'],
      trim: true
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for performance
ledgerCounterSchema.index({ type: 1, isActive: 1 });

// Static method to get next number for a type
ledgerCounterSchema.statics.getNext = async function(type) {
  const prefixMap = {
    'PAYABLE': '01',
    'RECEIVABLE': '02', 
    'EXPENSE': '03'
  };
  
  const prefix = prefixMap[type];
  if (!prefix) {
    throw new Error(`Invalid ledger type: ${type}`);
  }
  
  const counter = await this.findOneAndUpdate(
    { type: type },
    { 
      $inc: { count: 1 },
      $setOnInsert: { prefix: prefix, isActive: true }
    },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  
  // Format: 01001, 02001, 03001 etc.
  const formattedNumber = prefix + String(counter.count).padStart(3, '0');
  return formattedNumber;
};

module.exports = mongoose.model("LedgerCounter", ledgerCounterSchema);
