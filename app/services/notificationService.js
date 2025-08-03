const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Settings = require('../models/settingsModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

class NotificationService {
  constructor() {
    this.transporter = null;
  }

  // Create email transporter based on settings
  async createTransporter() {
    try {
      if (this.transporter) {
        return this.transporter;
      }

      const emailConfig = await Settings.getEmailConfig();
      
      if (!emailConfig || !emailConfig.username || !emailConfig.password) {
        console.error('Email configuration incomplete');
        return null;
      }

      const transporterConfig = {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.username,
          pass: emailConfig.password
        }
      };

      this.transporter = nodemailer.createTransporter(transporterConfig);
      
      // Verify the connection
      await this.transporter.verify();
      console.log('Email transporter created successfully');
      
      return this.transporter;
    } catch (error) {
      console.error('Error creating email transporter:', error.message);
      this.transporter = null;
      return null;
    }
  }

  // Create in-app notification
  async createNotification(data) {
    try {
      const notification = new Notification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        priority: data.priority || 'MEDIUM'
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error.message);
      throw error;
    }
  }

  // Send email notification
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const transporter = await this.createTransporter();
      if (!transporter) {
        throw new Error('Email transporter not available');
      }

      const emailConfig = await Settings.getCategory('email');
      const companyInfo = await Settings.getCategory('company');

      const mailOptions = {
        from: {
          name: emailConfig.fromName || companyInfo.name || 'DMS System',
          address: emailConfig.fromAddress
        },
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Dual-channel notification (in-app + email)
  async sendDualNotification(userId, type, title, message, data = {}, emailSubject = null, emailContent = null) {
    try {
      const results = {
        inApp: null,
        email: null
      };

      // Get user with notification preferences
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Always create in-app notification
      results.inApp = await this.createNotification({
        userId,
        type,
        title,
        message,
        data
      });

      // Send email if user has email notifications enabled for this type
      const emailEnabled = this.isEmailEnabledForUser(user, type);
      if (emailEnabled && user.email) {
        const finalEmailSubject = emailSubject || title;
        const finalEmailContent = emailContent || this.generateEmailTemplate(title, message, data);
        
        results.email = await this.sendEmail(
          user.email,
          finalEmailSubject,
          finalEmailContent
        );
      }

      return results;
    } catch (error) {
      console.error('Error sending dual notification:', error.message);
      throw error;
    }
  }

  // Check if email is enabled for user and notification type
  isEmailEnabledForUser(user, type) {
    if (!user.notificationPreferences) {
      return false;
    }

    const prefs = user.notificationPreferences;
    
    switch (type) {
      case 'LOW_STOCK':
        return prefs.lowStock?.email === true;
      case 'EXPIRY_WARNING':
        return prefs.expiry?.email === true;
      case 'PAYMENT_REMINDER':
        return prefs.payment?.email === true;
      case 'LICENSE_EXPIRY':
        return prefs.licenseExpiry?.email === true;
      default:
        return true; // Default to true for system notifications
    }
  }

  // Generate email template
  generateEmailTemplate(title, message, data = {}) {
    const companyName = data.companyName || 'DMS System';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">${companyName}</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Pharmaceutical Distribution Management</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0; font-size: 24px;">${title}</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">${message}</p>
            </div>
            
            ${data.details ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Details:</h3>
                ${Object.entries(data.details).map(([key, value]) => 
                  `<p style="margin: 5px 0;"><strong>${key}:</strong> ${value}</p>`
                ).join('')}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6c757d; font-size: 14px;">
                This is an automated notification from ${companyName}.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  // Low stock notification
  async sendLowStockNotification(productDetails, userId = null) {
    try {
      const title = `🚨 Low Stock Alert - ${productDetails.productName}`;
      const message = `Product "${productDetails.productName}" is running low. Current stock: ${productDetails.currentStock} ${productDetails.unit}. Minimum required: ${productDetails.minStock} ${productDetails.unit}.`;
      
      const data = {
        details: {
          'Product Name': productDetails.productName,
          'Current Stock': `${productDetails.currentStock} ${productDetails.unit}`,
          'Minimum Stock': `${productDetails.minStock} ${productDetails.unit}`,
          'Brand': productDetails.brandName || 'N/A',
          'Batch Number': productDetails.batchNumber || 'N/A',
          'Location': productDetails.location || 'N/A'
        }
      };

      if (userId) {
        return await this.sendDualNotification(userId, 'LOW_STOCK', title, message, data);
      }

      const users = await User.find({
        'notificationPreferences.lowStock.inApp': true,
        isActive: true
      });

      const results = [];
      for (const user of users) {
        try {
          const result = await this.sendDualNotification(user._id, 'LOW_STOCK', title, message, data);
          results.push({ userId: user._id, ...result });
        } catch (error) {
          console.error(`Error sending low stock notification to user ${user._id}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in sendLowStockNotification:', error.message);
      throw error;
    }
  }

  // Expiry warning notification
  async sendExpiryWarningNotification(productDetails, userId = null) {
    try {
      const daysUntilExpiry = Math.ceil((new Date(productDetails.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      const title = `⚠️ Product Expiry Warning - ${productDetails.productName}`;
      const message = `Product "${productDetails.productName}" will expire in ${daysUntilExpiry} days (${new Date(productDetails.expiryDate).toLocaleDateString()}).`;
      
      const data = {
        details: {
          'Product Name': productDetails.productName,
          'Expiry Date': new Date(productDetails.expiryDate).toLocaleDateString(),
          'Days Until Expiry': daysUntilExpiry,
          'Batch Number': productDetails.batchNumber || 'N/A',
          'Quantity': `${productDetails.quantity} ${productDetails.unit}`,
          'Location': productDetails.location || 'N/A'
        }
      };

      if (userId) {
        return await this.sendDualNotification(userId, 'EXPIRY_WARNING', title, message, data);
      }

      const users = await User.find({
        'notificationPreferences.expiry.inApp': true,
        isActive: true
      });

      const results = [];
      for (const user of users) {
        try {
          const result = await this.sendDualNotification(user._id, 'EXPIRY_WARNING', title, message, data);
          results.push({ userId: user._id, ...result });
        } catch (error) {
          console.error(`Error sending expiry warning to user ${user._id}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in sendExpiryWarningNotification:', error.message);
      throw error;
    }
  }

  // Payment reminder notification
  async sendPaymentReminderNotification(invoiceDetails, userId) {
    try {
      const daysOverdue = Math.ceil((new Date() - new Date(invoiceDetails.dueDate)) / (1000 * 60 * 60 * 24));
      const title = `💰 Payment Reminder - Invoice ${invoiceDetails.invoiceNumber}`;
      const message = `Payment for invoice ${invoiceDetails.invoiceNumber} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `due on ${new Date(invoiceDetails.dueDate).toLocaleDateString()}`}. Amount: ${invoiceDetails.currency} ${invoiceDetails.totalAmount}`;
      
      const data = {
        details: {
          'Invoice Number': invoiceDetails.invoiceNumber,
          'Customer': invoiceDetails.customerName,
          'Amount': `${invoiceDetails.currency} ${invoiceDetails.totalAmount}`,
          'Due Date': new Date(invoiceDetails.dueDate).toLocaleDateString(),
          'Status': daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due soon'
        }
      };

      return await this.sendDualNotification(userId, 'PAYMENT_REMINDER', title, message, data);
    } catch (error) {
      console.error('Error in sendPaymentReminderNotification:', error.message);
      throw error;
    }
  }

  // License expiry notification
  async sendLicenseExpiryNotification(licenseDetails, userId) {
    try {
      const daysUntilExpiry = Math.ceil((new Date(licenseDetails.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      const title = `📋 License Expiry Warning - ${licenseDetails.licenseName}`;
      const message = `License "${licenseDetails.licenseName}" will expire in ${daysUntilExpiry} days (${new Date(licenseDetails.expiryDate).toLocaleDateString()}).`;
      
      const data = {
        details: {
          'License Name': licenseDetails.licenseName,
          'License Number': licenseDetails.licenseNumber,
          'Expiry Date': new Date(licenseDetails.expiryDate).toLocaleDateString(),
          'Days Until Expiry': daysUntilExpiry,
          'Holder': licenseDetails.holderName || 'N/A'
        }
      };

      return await this.sendDualNotification(userId, 'LICENSE_EXPIRY', title, message, data);
    } catch (error) {
      console.error('Error in sendLicenseExpiryNotification:', error.message);
      throw error;
    }
  }

  // Get user notifications with pagination
  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const query = { userId: mongoose.Types.ObjectId(userId) };
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ userId: mongoose.Types.ObjectId(userId), isRead: false });

      return {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error.message);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error.message);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error.message);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                isRead: '$isRead'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return { total: 0, unread: 0, byType: {} };
      }

      const result = stats[0];
      const typeStats = {};
      
      result.byType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, unread: 0 };
        }
        typeStats[item.type].total++;
        if (!item.isRead) {
          typeStats[item.type].unread++;
        }
      });

      return {
        total: result.total,
        unread: result.unread,
        byType: typeStats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error.message);
      throw error;
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    try {
      const transporter = await this.createTransporter();
      if (!transporter) {
        return { success: false, message: 'Email transporter not configured' };
      }

      const emailConfig = await Settings.getCategory('email');
      const companyInfo = await Settings.getCategory('company');
      
      const mailOptions = {
        from: {
          name: emailConfig.fromName,
          address: emailConfig.fromAddress
        },
        to: emailConfig.fromAddress, // Send test email to self
        subject: 'DMS Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin: 0;">✅ Email Configuration Test</h2>
            </div>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p><strong>Company:</strong> ${companyInfo.name}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 20px 0;">
              <strong>Success!</strong> Your email configuration is working properly.
            </div>
          </div>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId, message: 'Test email sent successfully' };
    } catch (error) {
      console.error('Error testing email configuration:', error.message);
      return { success: false, message: `Email test failed: ${error.message}` };
    }
  }
}

module.exports = new NotificationService();
