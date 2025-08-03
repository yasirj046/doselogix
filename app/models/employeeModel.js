const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { PROVINCE_ENUM } = require("../constants/provinces");
const { ALL_CITIES } = require("../constants/cities");
const { DESIGNATION_ENUM } = require("../constants/designations");

const employeeSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      enum: {
        values: PROVINCE_ENUM,
        message: 'Invalid province selected'
      }
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: {
        values: ALL_CITIES,
        message: 'Invalid city selected'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [10, 'Address must be at least 10 characters'],
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      validate: {
        validator: function(v) {
          return /^\+92[0-9]{10}$/.test(v);
        },
        message: 'Contact must be in format +92XXXXXXXXXX'
      }
    },
    referencePerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference person name cannot exceed 100 characters']
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(v);
        },
        message: 'CNIC must be in format XXXXX-XXXXXXX-X'
      }
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [1, 'Salary must be greater than 0'],
      max: [10000000, 'Salary cannot exceed 10,000,000 PKR']
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: {
        values: DESIGNATION_ENUM,
        message: 'Invalid designation selected'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Add pagination plugin
employeeSchema.plugin(mongoosePaginate);

// Comprehensive indexing for performance optimization
// Text search index for name and address
employeeSchema.index({ 
  name: 'text', 
  address: 'text' 
});

// Note: employeeId and cnic already have unique indexes from unique: true field definitions

// Compound indexes for common query patterns
employeeSchema.index({ province: 1, city: 1, isActive: 1 });
employeeSchema.index({ designation: 1, isActive: 1 });
employeeSchema.index({ isActive: 1, createdAt: -1 });

// Custom validation for city-province relationship
employeeSchema.pre('save', function(next) {
  const { CITIES } = require("../constants/cities");
  
  if (this.isModified('city') || this.isModified('province')) {
    const provinceCities = CITIES[this.province];
    if (!provinceCities || !provinceCities[this.city]) {
      return next(new Error(`City ${this.city} is not valid for province ${this.province}`));
    }
  }
  next();
});

module.exports = mongoose.model("Employee", employeeSchema);
