const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  companyEmail: {
    type: String,
    required: [true, 'Company email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  companyPhone: {
    type: String,
    trim: true
  },
  companyAddress: {
    type: String,
    trim: true
  },
  companyCity: {
    type: String,
    trim: true
  },
  companyProvince: {
    type: String,
    trim: true
  },
  companyType: {
    type: String,
    enum: ['distributor', 'manufacturer', 'retailer'],
    default: 'distributor'
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Verification system
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected', 'suspended'],
    default: 'pending_verification'
  },
  verificationOtp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  // Subscription information
  subscription: {
    plan: {
      type: String,
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    expiresAt: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Additional indexes for performance (only non-unique fields)
companySchema.index({ isActive: 1 });
companySchema.index({ createdAt: -1 });

// Virtual for days until license expiry
companySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.licenseExpiry) return null;
  const today = new Date();
  const diffTime = this.licenseExpiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if license is expiring soon (30 days)
companySchema.methods.isLicenseExpiringSoon = function() {
  const daysUntilExpiry = this.daysUntilExpiry;
  return daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

// Method to check if license is expired
companySchema.methods.isLicenseExpired = function() {
  return this.licenseExpiry < new Date();
};

// Pre-save middleware to hash password
companySchema.pre('save', async function(next) {
  if (!this.isModified('adminUser.password')) return next();
  
  const bcrypt = require('bcryptjs');
  this.adminUser.password = await bcrypt.hash(this.adminUser.password, 12);
  next();
});

// Method to compare password
companySchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.adminUser.password);
};

// Method to generate verification token
companySchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-digit OTP
  this.verificationToken = token;
  this.verificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return token;
};

module.exports = mongoose.model('Company', companySchema);
