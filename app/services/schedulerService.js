const cron = require('node-cron');
const notificationService = require('./notificationService');
const Settings = require('../models/settingsModel');
const User = require('../models/userModel');

const schedulerService = {
  // Initialize all scheduled jobs
  async initializeSchedulers() {
    try {
      // Check low stock every hour
      this.scheduleHourlyLowStockCheck();
      
      // Check expiry warnings daily at 9:00 AM
      this.scheduleDailyExpiryCheck();
      
      // Check payment reminders daily at 10:00 AM
      this.scheduleDailyPaymentReminders();
      
      // Check license expiry daily at 11:00 AM
      this.scheduleDailyLicenseExpiryCheck();
      
    } catch (error) {
      console.error('❌ Error initializing schedulers:', error.message);
    }
  },

  // Schedule hourly low stock checks
  scheduleHourlyLowStockCheck() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      console.log('🔍 Running hourly low stock check...');
      try {
        await this.checkLowStockAutomated();
      } catch (error) {
        console.error('❌ Error in hourly low stock check:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Karachi"
    });
  },

  // Schedule daily expiry warnings
  scheduleDailyExpiryCheck() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔍 Running daily expiry warning check...');
      try {
        await this.checkExpiryWarningsAutomated();
      } catch (error) {
        console.error('❌ Error in daily expiry check:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Karachi"
    });
  },

  // Schedule daily payment reminders
  scheduleDailyPaymentReminders() {
    // Run daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('🔍 Running daily payment reminder check...');
      try {
        await this.checkPaymentRemindersAutomated();
      } catch (error) {
        console.error('❌ Error in daily payment reminder check:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Karachi"
    });
  },

  // Schedule daily license expiry checks
  scheduleDailyLicenseExpiryCheck() {
    // Run daily at 11:00 AM
    cron.schedule('0 11 * * *', async () => {
      console.log('🔍 Running daily license expiry check...');
      try {
        await this.checkLicenseExpiryAutomated();
      } catch (error) {
        console.error('❌ Error in daily license expiry check:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Karachi"
    });
  },

  // Automated low stock checking
  async checkLowStockAutomated() {
    try {
      console.log(`📦 Checking for low stock items (placeholder logic)`);
      const lowStockItems = []; // Placeholder - replace with actual inventory query
      
      // Send notifications for each low stock item
      let successCount = 0;
      for (const item of lowStockItems) {
        try {
          const result = await notificationService.sendLowStockNotification(item);
          if (result.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error sending low stock notification:`, error.message);
        }
      }

      return { 
        success: true, 
        itemsProcessed: lowStockItems.length,
        successCount
      };
    } catch (error) {
      console.error('❌ Error in automated low stock check:', error.message);
      throw error;
    }
  },

  // Automated expiry warning checking
  async checkExpiryWarningsAutomated() {
    try {
      console.log(`⏰ Checking for expiring items (placeholder logic)`);
      const expiringItems = []; // Placeholder - replace with actual inventory query

      // Send notifications for each expiring item
      let successCount = 0;
      for (const item of expiringItems) {
        try {
          const result = await notificationService.sendExpiryWarningNotification(item);
          if (result.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error sending expiry warning:`, error.message);
        }
      }

      return { 
        success: true, 
        itemsProcessed: expiringItems.length,
        successCount
      };
    } catch (error) {
      console.error('❌ Error in automated expiry warning check:', error.message);
      throw error;
    }
  },

  // Automated payment reminder checking
  async checkPaymentRemindersAutomated() {
    try {
      console.log(`💰 Checking for overdue invoices (placeholder logic)`);
      const overdueInvoices = []; // Placeholder - replace with actual invoice query

      // Send payment reminders
      let successCount = 0;
      for (const invoice of overdueInvoices) {
        try {
          const result = await notificationService.sendPaymentReminderNotification(
            invoice,
            invoice.assignedTo
          );
          if (result.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error sending payment reminder:`, error.message);
        }
      }

      return { 
        success: true, 
        itemsProcessed: overdueInvoices.length,
        successCount
      };
    } catch (error) {
      console.error('❌ Error in automated payment reminder check:', error.message);
      throw error;
    }
  },

  // Automated license expiry checking
  async checkLicenseExpiryAutomated() {
    try {
      console.log(`📋 Checking for expiring licenses`);
      
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 30); // 30 days warning

      // Check user license expiry
      const usersWithExpiringLicenses = await User.find({
        'licenseInfo.expiryDate': {
          $gte: new Date(),
          $lte: warningDate
        },
        isActive: true
      }).select('name email licenseInfo');

      console.log(`📋 Found ${usersWithExpiringLicenses.length} users with expiring licenses`);

      // Send license expiry notifications to users
      let userSuccessCount = 0;
      for (const user of usersWithExpiringLicenses) {
        try {
          const licenseDetails = {
            licenseName: user.licenseInfo.type || 'User License',
            licenseNumber: user.licenseInfo.number,
            expiryDate: user.licenseInfo.expiryDate,
            holderName: user.name
          };

          const result = await notificationService.sendLicenseExpiryNotification(
            licenseDetails,
            user._id
          );
          
          if (result.success) {
            userSuccessCount++;
            console.log(`✅ License expiry notification sent to ${user.name}`);
          }
        } catch (error) {
          console.error(`❌ Error sending license expiry notification to ${user.name}:`, error.message);
        }
      }

      return { 
        success: true, 
        usersProcessed: usersWithExpiringLicenses.length,
        userSuccessCount,
        totalProcessed: usersWithExpiringLicenses.length
      };
    } catch (error) {
      console.error('❌ Error in automated license expiry check:', error.message);
      throw error;
    }
  },

  // Manual trigger methods for testing and admin use
  async triggerLowStockCheck() {
    console.log('🔧 Manual trigger: Low stock check');
    return await this.checkLowStockAutomated();
  },

  async triggerExpiryCheck() {
    console.log('🔧 Manual trigger: Expiry warning check');
    return await this.checkExpiryWarningsAutomated();
  },

  async triggerPaymentReminders() {
    console.log('🔧 Manual trigger: Payment reminder check');
    return await this.checkPaymentRemindersAutomated();
  },

  async triggerLicenseExpiryCheck() {
    console.log('🔧 Manual trigger: License expiry check');
    return await this.checkLicenseExpiryAutomated();
  },

  // Get scheduler status for admin dashboard
  getSchedulerStatus() {
    return {
      lowStockCheck: {
        schedule: 'Every hour at minute 0',
        nextRun: 'Top of next hour',
        enabled: true
      },
      expiryWarning: {
        schedule: 'Daily at 9:00 AM',
        nextRun: 'Tomorrow 9:00 AM',
        enabled: true
      },
      paymentReminder: {
        schedule: 'Daily at 10:00 AM',
        nextRun: 'Tomorrow 10:00 AM',
        enabled: true
      },
      licenseExpiry: {
        schedule: 'Daily at 11:00 AM',
        nextRun: 'Tomorrow 11:00 AM',
        enabled: true
      },
      timezone: 'Asia/Karachi',
      status: 'Active',
      lastInitialized: new Date().toISOString()
    };
  },

  // Run all checks manually (useful for testing)
  async runAllChecks() {
    console.log('🔧 Running all notification checks manually...');
    
    const results = {
      lowStock: null,
      expiry: null,
      payment: null,
      license: null,
      timestamp: new Date().toISOString()
    };

    try {
      results.lowStock = await this.triggerLowStockCheck();
    } catch (error) {
      results.lowStock = { success: false, error: error.message };
    }

    try {
      results.expiry = await this.triggerExpiryCheck();
    } catch (error) {
      results.expiry = { success: false, error: error.message };
    }

    try {
      results.payment = await this.triggerPaymentReminders();
    } catch (error) {
      results.payment = { success: false, error: error.message };
    }

    try {
      results.license = await this.triggerLicenseExpiryCheck();
    } catch (error) {
      results.license = { success: false, error: error.message };
    }

    console.log('✅ All notification checks completed');
    return results;
  }
};

module.exports = schedulerService;
