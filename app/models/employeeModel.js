const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { DESIGNATION_ENUM } = require("../constants/designations");
const { ALL_CITIES } = require("../constants/cities");

const employeeSchema = new mongoose.Schema(
  {
    // Reference to vendor/user
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Basic employee information
    employeeName: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
      maxlength: [100, 'Employee name cannot exceed 100 characters']
    },
    
    // Location information
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: 
      {
        values: ALL_CITIES,
        message: 'Invalid city selected'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    
    // Contact information
    primaryContact: {
      type: String,
      required: [true, 'Primary contact is required'],
      trim: true,
      maxlength: [20, 'Primary contact cannot exceed 20 characters']
    },
    secondaryContact: {
      type: String,
      trim: true,
      maxlength: [20, 'Secondary contact cannot exceed 20 characters']
    },
    
    // Personal information
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      trim: true,
      maxlength: [15, 'CNIC cannot exceed 15 characters'],
      match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC format should be 12345-1234567-1']
    },
    
    // Reference information
    referencePerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference person name cannot exceed 100 characters']
    },
    referencePersonContact: {
      type: String,
      trim: true,
      maxlength: [20, 'Reference person contact cannot exceed 20 characters']
    },
    referencePersonAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Reference person address cannot exceed 500 characters']
    },
    
    // Employment information
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative']
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: {
        values: DESIGNATION_ENUM,
        message: 'Invalid designation'
      }
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
employeeSchema.index({ vendorId: 1, isActive: 1 });
employeeSchema.index({ vendorId: 1, employeeName: 1 });
employeeSchema.index({ vendorId: 1, cnic: 1 });

// Virtual for employee full info
employeeSchema.virtual('fullInfo').get(function() {
  return `${this.employeeName} - ${this.designation}`;
});

// Plugin for pagination
employeeSchema.plugin(mongoosePaginate);

// Compound unique index to prevent duplicate CNIC per vendor
employeeSchema.index({ vendorId: 1, cnic: 1 }, { unique: true });

module.exports = mongoose.model("Employee", employeeSchema);
