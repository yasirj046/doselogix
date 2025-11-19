const cron = require('node-cron');
const axios = require('axios');
const HealthNews = require('../models/healthNewsModel');

class HealthNewsCronJob {
  constructor() {
    this.isRunning = false;
    this.pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
  }

  /**
   * Start the cron job for syncing health news
   */
  start() {
    if (this.isRunning) {
      console.log('Health news cron job is already running');
      return;
    }

    // Schedule sync at 12:00 AM Pakistan time (UTC+5)
    // This runs at 7:00 PM UTC (12:00 AM PKT) - right after Python scrapes at 11:59 PM
    const cronExpression = '0 19 * * *'; // Every day at 19:00 UTC (00:00 PKT next day)
    
    this.syncTask = cron.schedule(cronExpression, async () => {
      await this.syncHealthNews();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start the task
    this.syncTask.start();
    this.isRunning = true;
    
    console.log('Health news cron job started - Will sync at 12:00 AM Pakistan time');
    
    // Perform initial sync on startup
    this.syncHealthNews();
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.syncTask) {
      this.syncTask.stop();
      this.syncTask.destroy();
      this.syncTask = null;
    }
    this.isRunning = false;
    console.log('Health news cron job stopped');
  }

  /**
   * Sync health news from Python server
   */
  async syncHealthNews() {
    try {
      console.log('🔄 Starting health news sync from Python server...');
      
      const response = await axios.get(`${this.pythonServerUrl}/api/health-news`, {
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.data || !response.data.news) {
        console.error('❌ Invalid response from Python server');
        return;
      }

      const newsArray = response.data.news;
      console.log(`📰 Received ${newsArray.length} news items from Python server`);

      if (newsArray.length === 0) {
        console.log('ℹ️ No news to sync');
        return;
      }

      // Use bulk upsert to avoid duplicates
      const result = await HealthNews.bulkUpsertNews(newsArray);
      
      console.log(`✅ Health news sync completed:`);
      console.log(`   - Inserted: ${result.nUpserted || 0}`);
      console.log(`   - Updated: ${result.nModified || 0}`);
      console.log(`   - Total processed: ${newsArray.length}`);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to Python server. Is it running?');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ Python server request timed out');
      } else {
        console.error('❌ Error syncing health news:', error.message);
      }
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerSync() {
    return await this.syncHealthNews();
  }
}

// Create singleton instance
const healthNewsCronJob = new HealthNewsCronJob();

module.exports = healthNewsCronJob;
