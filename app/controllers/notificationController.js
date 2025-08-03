const notificationService = require('../services/notificationService');
const User = require('../models/userModel');

const notificationController = {
  // Get user notifications with pagination
  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userId = req.user.id;

      const result = await notificationService.getUserNotifications(
        userId,
        parseInt(page),
        parseInt(limit),
        unreadOnly === 'true'
      );

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount
      });
    } catch (error) {
      console.error('Error getting notifications:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
        error: error.message
      });
    }
  },

  // Get unread notifications count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.getUserNotifications(userId, 1, 1);
      
      res.status(200).json({
        success: true,
        unreadCount: result.unreadCount
      });
    } catch (error) {
      console.error('Error getting unread count:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  },

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.deleteNotification(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error deleting notification:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  },

  // Get notification statistics
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await notificationService.getNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics',
        error: error.message
      });
    }
  },

  // Update user notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { notificationPreferences } = req.body;

      // Validate notification preferences structure
      const validTypes = ['lowStock', 'expiry', 'payment', 'licenseExpiry'];
      const validChannels = ['inApp', 'email'];

      if (!notificationPreferences || typeof notificationPreferences !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification preferences format'
        });
      }

      // Validate each notification type
      for (const [type, preferences] of Object.entries(notificationPreferences)) {
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid notification type: ${type}`
          });
        }

        if (preferences && typeof preferences === 'object') {
          for (const channel of Object.keys(preferences)) {
            if (!validChannels.includes(channel)) {
              return res.status(400).json({
                success: false,
                message: `Invalid notification channel: ${channel}`
              });
            }
          }
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences },
        { new: true, runValidators: true }
      ).select('notificationPreferences');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedUser.notificationPreferences
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error.message
      });
    }
  },

  // Get user notification preferences
  async getNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).select('notificationPreferences');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user.notificationPreferences || {
          lowStock: { inApp: true, email: false },
          expiry: { inApp: true, email: false },
          payment: { inApp: true, email: false },
          licenseExpiry: { inApp: true, email: false }
        }
      });
    } catch (error) {
      console.error('Error getting notification preferences:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification preferences',
        error: error.message
      });
    }
  },

  // Test notification (for development/testing)
  async testNotification(req, res) {
    try {
      const userId = req.user.id;
      const { type = 'SYSTEM', title = 'Test Notification', message = 'This is a test notification' } = req.body;

      const result = await notificationService.sendDualNotification(
        userId,
        type,
        title,
        message,
        { testData: 'This is test data' }
      );

      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Error sending test notification:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: error.message
      });
    }
  },

  // Test email configuration (admin only)
  async testEmailConfiguration(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin users can test email configuration'
        });
      }

      const result = await notificationService.testEmailConfiguration();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          messageId: result.messageId
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error testing email configuration:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to test email configuration',
        error: error.message
      });
    }
  }
};

module.exports = notificationController;
