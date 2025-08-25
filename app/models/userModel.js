const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic vendor information
    vendorName: { 
      type: String, 
      required: [true, 'Vendor name is required'],
      trim: true,
      maxlength: [100, 'Vendor name cannot exceed 100 characters']
    },
    vendorEmail: { 
      type: String, 
      required: [true, 'Vendor email is required'], 
      unique: true,
      lowercase: true,
      trim: true
    },
    vendorPassword: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    
    // Contact information (moved outside profile object)
    vendorPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters']
    },
    vendorAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    
    // Business information
    businessName: {
      type: String,
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters']
    },
    businessLicenseNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'License number cannot exceed 100 characters']
    },
    businessLicenseExpiryDate: {
      type: Date
    },
    businessLicenseIssueDate: {
      type: Date
    },
    businessLicenseAuthority: {
      type: String,
      trim: true,
      maxlength: [200, 'Issuing authority cannot exceed 200 characters']
    },
    
    // System fields
    vendorRole: {
      type: String,
      enum: ['vendor', 'admin'],
      default: 'vendor'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add pagination plugin
userSchema.plugin(mongoosePaginate);

// Indexes for better performance
userSchema.index({ vendorName: "text" }); // Remove vendorEmail from text index
userSchema.index({ vendorEmail: 1 }, { unique: true }); // Add unique index for email
userSchema.index({ vendorRole: 1, isActive: 1 });
userSchema.index({ businessLicenseExpiryDate: 1 });

// Virtual for business license status
userSchema.virtual('businessLicenseStatus').get(function() {
  if (!this.businessLicenseExpiryDate) {
    return { status: 'NOT_SET', daysRemaining: null };
  }
  
  const today = new Date();
  const expiryDate = new Date(this.businessLicenseExpiryDate);
  const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  let status = 'VALID';
  if (daysRemaining < 0) {
    status = 'EXPIRED';
  } else if (daysRemaining <= 7) {
    status = 'URGENT';
  } else if (daysRemaining <= 60) {
    status = 'WARNING';
  }
  
  return { status, daysRemaining };
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Hash password if it's a new document or if password has been modified
  if (this.isNew || this.isModified('vendorPassword')) {
    try {
      // Hash password with cost of 10 (good balance between security and performance)
      const hashedPassword = await bcrypt.hash(this.vendorPassword, 10);
      this.vendorPassword = hashedPassword;
    } catch (error) {
      console.error('Password hashing error:', error);
      return next(error);
    }
  }
  
  next();
});

// Instance method to hash password manually if needed
userSchema.methods.hashPassword = async function() {
  if (this.vendorPassword && !this.vendorPassword.startsWith('$2')) {
    // Password is not hashed (bcrypt hashes start with $2)
    const hashedPassword = await bcrypt.hash(this.vendorPassword, 10);
    this.vendorPassword = hashedPassword;
    return true;
  }
  return false;
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.vendorPassword);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Static method to find vendors with expiring business license
userSchema.statics.findVendorsWithExpiringLicense = async function(daysBefore) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);
  
  return await this.find({
    businessLicenseExpiryDate: {
      $lte: targetDate,
      $gte: new Date()
    },
    isActive: true
  });
};

module.exports = mongoose.model("User", userSchema);