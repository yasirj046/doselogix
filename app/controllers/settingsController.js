const Settings = require('../models/settingsModel');
const util = require('../util/util');

const settingsController = {
  // Get all settings (admin only)
  async getSettings(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json(
          util.createResponse(null, { message: 'Only admin users can access settings' })
        );
      }

      const settings = await Settings.getInstance();
      
      res.status(200).json(
        util.createResponse(settings, null, 'Settings retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting settings:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Get specific settings category
  async getSettingsCategory(req, res) {
    try {
      const { category } = req.params;
      
      // Check if user is admin for sensitive categories
      const sensitiveCategories = ['email'];
      if (sensitiveCategories.includes(category) && req.user.role !== 'admin') {
        return res.status(403).json(
          util.createResponse(null, { message: 'Only admin users can access this settings category' })
        );
      }

      const categoryData = await Settings.getCategory(category);
      
      if (Object.keys(categoryData).length === 0) {
        return res.status(404).json(
          util.createResponse(null, { message: `Settings category '${category}' not found` })
        );
      }

      res.status(200).json(
        util.createResponse(categoryData, null, `${category} settings retrieved successfully`)
      );
    } catch (error) {
      console.error('Error getting settings category:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Update settings category (admin only)
  async updateSettingsCategory(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json(
          util.createResponse(null, { message: 'Only admin users can update settings' })
        );
      }

      const { category } = req.params;
      const updateData = req.body;

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json(
          util.createResponse(null, { message: 'Update data is required' })
        );
      }

      const updatedSettings = await Settings.updateSettings(category, updateData, req.user.id);
      
      res.status(200).json(
        util.createResponse(updatedSettings[category], null, `${category} settings updated successfully`)
      );
    } catch (error) {
      console.error('Error updating settings category:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Get company information (public - for branding)
  async getCompanyInfo(req, res) {
    try {
      const companyInfo = await Settings.getCategory('company');
      
      // Return only public company information
      const publicCompanyInfo = {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        logo: companyInfo.logo
      };

      res.status(200).json(
        util.createResponse(publicCompanyInfo, null, 'Company information retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting company info:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Get system information (public - for display purposes)
  async getSystemInfo(req, res) {
    try {
      const systemInfo = await Settings.getCategory('system');
      const settings = await Settings.getInstance();
      
      const publicSystemInfo = {
        timezone: systemInfo.timezone,
        dateFormat: systemInfo.dateFormat,
        timeFormat: systemInfo.timeFormat,
        version: settings.version,
        maintenanceMode: systemInfo.maintenanceMode
      };

      res.status(200).json(
        util.createResponse(publicSystemInfo, null, 'System information retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting system info:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Get financial settings (admin only)
  async getFinancialSettings(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json(
          util.createResponse(null, { message: 'Only admin users can access financial settings' })
        );
      }

      const financialSettings = await Settings.getCategory('financial');
      
      res.status(200).json(
        util.createResponse(financialSettings, null, 'Financial settings retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting financial settings:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Get ID generation information (read-only)
  async getIdGenerationInfo(req, res) {
    try {
      const idGenInfo = await Settings.getCategory('idGeneration');
      
      res.status(200).json(
        util.createResponse(idGenInfo, null, 'ID generation information retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting ID generation info:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Test email configuration (admin only)
  async testEmailConfiguration(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json(
          util.createResponse(null, { message: 'Only admin users can test email configuration' })
        );
      }

      const notificationService = require('../services/notificationService');
      const result = await notificationService.testEmailConfiguration();

      if (result.success) {
        res.status(200).json(
          util.createResponse(
            { messageId: result.messageId },
            null,
            result.message
          )
        );
      } else {
        res.status(400).json(
          util.createResponse(null, { message: result.message })
        );
      }
    } catch (error) {
      console.error('Error testing email configuration:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Initialize default settings (admin only)
  async initializeSettings(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json(
          util.createResponse(null, { message: 'Only admin users can initialize settings' })
        );
      }

      const settings = await Settings.getInstance();
      
      res.status(200).json(
        util.createResponse(settings, null, 'Settings initialized successfully')
      );
    } catch (error) {
      console.error('Error initializing settings:', error.message);
      res.status(500).json(
        util.createResponse(null, { message: error.message })
      );
    }
  },

  // Legacy methods for backward compatibility
  async updateSettings(req, res) {
    return this.updateSettingsCategory(req, res);
  },

  async getSettingCategory(req, res) {
    return this.getSettingsCategory(req, res);
  }
};

module.exports = settingsController;
