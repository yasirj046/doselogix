const mongoose = require("mongoose");

const invoiceCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    sequence_value: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("InvoiceCounter", invoiceCounterSchema);
