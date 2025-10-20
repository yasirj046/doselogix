const cron = require('node-cron');
const LedgerService = require('../services/ledgerService');
const User = require('../models/userModel');

class LedgerCronJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the cron job for daily snapshots
   */
  start() {
    if (this.isRunning) {
      console.log('Ledger cron job is already running');
      return;
    }

    // Schedule daily snapshot at 11:59 PM Pakistan time (UTC+5)
    // This runs at 6:59 PM UTC (11:59 PM PKT)
    const cronExpression = '59 18 * * *'; // Every day at 18:59 UTC (23:59 PKT)
    
    this.dailySnapshotTask = cron.schedule(cronExpression, async () => {
      await this.createDailySnapshots();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start the task
    this.dailySnapshotTask.start();
    this.isRunning = true;
    
    console.log('Ledger cron job started - Daily snapshots will be created at 11:59 PM Pakistan time');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.dailySnapshotTask) {
      this.dailySnapshotTask.stop();
      this.dailySnapshotTask.destroy();
      this.dailySnapshotTask = null;
    }
    this.isRunning = false;
    console.log('Ledger cron job stopped');
  }

  /**
   * Create daily snapshots for all vendors
   */
  async createDailySnapshots() {
    try {
      console.log('Starting daily snapshot creation...');
      
      // Get all active vendors
      const vendors = await User.find({ isActive: true });
      console.log(`Found ${vendors.length} active vendors`);
      
      const snapshotDate = new Date();
      snapshotDate.setHours(0, 0, 0, 0); // Start of day
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const vendor of vendors) {
        try {
          await LedgerService.createDailySnapshot(vendor._id, snapshotDate);
          successCount++;
          console.log(`Snapshot created for vendor: ${vendor.name} (${vendor._id})`);
        } catch (error) {
          errorCount++;
          console.error(`Error creating snapshot for vendor ${vendor.name} (${vendor._id}):`, error.message);
        }
      }
      
      console.log(`Daily snapshot creation completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error in daily snapshot creation:', error);
    }
  }

  /**
   * Create snapshot for a specific vendor and date (manual trigger)
   */
  async createSnapshotForVendor(vendorId, date) {
    try {
      const snapshot = await LedgerService.createDailySnapshot(vendorId, date);
      console.log(`Snapshot created for vendor ${vendorId} on ${date}`);
      return snapshot;
    } catch (error) {
      console.error(`Error creating snapshot for vendor ${vendorId}:`, error);
      throw error;
    }
  }

  /**
   * Get cron job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.dailySnapshotTask ? this.dailySnapshotTask.nextDate() : null,
      lastRun: this.lastRun || null
    };
  }

  /**
   * Test the cron job (for development)
   */
  async testSnapshotCreation() {
    try {
      console.log('Testing snapshot creation...');
      await this.createDailySnapshots();
      console.log('Test snapshot creation completed');
    } catch (error) {
      console.error('Error in test snapshot creation:', error);
    }
  }
}

// Create singleton instance
const ledgerCronJob = new LedgerCronJob();

module.exports = ledgerCronJob;
