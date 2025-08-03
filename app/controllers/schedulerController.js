const schedulerService = require("../services/schedulerService");

const schedulerController = {
  // Get scheduler status
  async getSchedulerStatus(req, res) {
    try {
      const status = schedulerService.getSchedulerStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Manually trigger low stock check
  async triggerLowStockCheck(req, res) {
    try {
      const result = await schedulerService.triggerLowStockCheck();
      res.status(200).json({
        success: true,
        message: 'Low stock check completed',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Manually trigger expiry check
  async triggerExpiryCheck(req, res) {
    try {
      const result = await schedulerService.triggerExpiryCheck();
      res.status(200).json({
        success: true,
        message: 'Expiry check completed',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Manually trigger payment reminder check
  async triggerPaymentReminderCheck(req, res) {
    try {
      const result = await schedulerService.triggerPaymentReminders();
      res.status(200).json({
        success: true,
        message: 'Payment reminder check completed',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Manually trigger license expiry check
  async triggerLicenseExpiryCheck(req, res) {
    try {
      const result = await schedulerService.triggerLicenseExpiryCheck();
      res.status(200).json({
        success: true,
        message: 'License expiry check completed',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Trigger all checks manually
  async triggerAllChecks(req, res) {
    try {
      const results = await schedulerService.runAllChecks();

      res.status(200).json({
        success: true,
        message: 'All notification checks completed',
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = schedulerController;
