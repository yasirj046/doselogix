const mongoose = require("mongoose");

const notificationCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence_value: {
    type: Number,
    default: 0
  }
});

// Static method to get next sequence number
notificationCounterSchema.statics.getNext = async function(sequenceName) {
  const counter = await this.findByIdAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  
  const paddedNumber = counter.sequence_value.toString().padStart(6, "0");
  return `NOT-${paddedNumber}`;
};

module.exports = mongoose.model("NotificationCounter", notificationCounterSchema);
