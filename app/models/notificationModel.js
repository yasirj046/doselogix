const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true
    },
    // Multi-tenant support
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    type: {
      type: String,
      enum: ['LOW_STOCK', 'EXPIRY_WARNING', 'PAYMENT_REMINDER', 'USER_LICENSE_EXPIRY', 'CUSTOMER_LICENSE_EXPIRY'],
      required: [true, 'Notification type is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    sourceType: {
      type: String,
      enum: ['INVENTORY', 'INVOICE', 'CUSTOMER', 'USER', 'SYSTEM'],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Some notifications might not have a specific source
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {} // Additional data for the notification
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date,
      default: null
    },
    emailError: {
      type: String,
      default: null
    },
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

// Add pagination plugin
notificationSchema.plugin(mongoosePaginate);

// Indexes for performance
notificationSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, isActive: 1 });
notificationSchema.index({ type: 1, isActive: 1 });
notificationSchema.index({ priority: 1, isActive: 1 });
notificationSchema.index({ sourceType: 1, sourceId: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1, userId: 1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    userId: userId,
    isRead: false,
    isActive: true
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId: userId, isRead: false, isActive: true },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);
