const mongoose = require("mongoose");

const employeeCounterSchema = new mongoose.Schema({
  sequence: { type: Number, default: 0 }
});

// MongoDB automatically creates _id index, no need to specify it manually

module.exports = mongoose.model("EmployeeCounter", employeeCounterSchema);
