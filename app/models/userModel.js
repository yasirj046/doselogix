const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    // Multi-tenant support (optional for standalone users)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'manager'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // User Profile Information
    profile: {
      phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone cannot exceed 20 characters']
      },
      address: {
        type: String,
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
      },
      company: {
        type: String,
        trim: true,
        maxlength: [200, 'Company name cannot exceed 200 characters']
      },
      license: {
        number: {
          type: String,
          trim: true,
          maxlength: [100, 'License number cannot exceed 100 characters']
        },
        expiryDate: {
          type: Date
        },
        issueDate: {
          type: Date
        },
        authority: {
          type: String,
          trim: true,
          maxlength: [200, 'Issuing authority cannot exceed 200 characters']
        }
      }
    },
    // User Notification Preferences
    notificationPreferences: {
      lowStock: {
        enabled: {
          type: Boolean,
          default: true
        },
        threshold: {
          type: Number,
          default: 1, // 1 carton default
          min: [1, 'Threshold must be at least 1']
        }
      },
      expiryWarning: {
        enabled: {
          type: Boolean,
          default: true
        },
        daysBefore: {
          type: Number,
          default: 90, // 90 days default
          min: [1, 'Days before must be at least 1']
        }
      },
      paymentReminder: {
        enabled: {
          type: Boolean,
          default: true
        },
        daysBefore: {
          type: Number,
          default: 7, // 1 week default
          min: [1, 'Days before must be at least 1']
        }
      },
      customerLicenseExpiry: {
        enabled: {
          type: Boolean,
          default: true
        }
      }
    },
    // System fields
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
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

// Indexes
userSchema.index({ name: "text", email: "text" });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'profile.license.expiryDate': 1 });

// Virtual for license days remaining
userSchema.virtual('licenseStatus').get(function() {
  if (!this.profile.license.expiryDate) {
    return { status: 'NOT_SET', daysRemaining: null };
  }
  
  const today = new Date();
  const expiryDate = new Date(this.profile.license.expiryDate);
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
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find users with expiring licenses
userSchema.statics.findUsersWithExpiringLicense = async function(daysBefore) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);
  
  return await this.find({
    'profile.license.expiryDate': {
      $lte: targetDate,
      $gte: new Date()
    },
    isActive: true
  });
};

module.exports = mongoose.model("User", userSchema);