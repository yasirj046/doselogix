const mongoose = require("mongoose");

const deliveryAssignmentCounterSchema = new mongoose.Schema(
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

module.exports = mongoose.model("DeliveryAssignmentCounter", deliveryAssignmentCounterSchema);
