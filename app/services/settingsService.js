const Settings = require("../models/settingsModel");

const settingsService = {
  // Get all settings
  async getSettings() {
    try {
      return await Settings.getSettings();
    } catch (error) {
      throw new Error(`Error fetching settings: ${error.message}`);
    }
  },

  // Update settings
  async updateSettings(updates, userId = null) {
    try {
      return await Settings.updateSettings(updates, userId);
    } catch (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }
  },

  // Get specific setting category
  async getSettingCategory(category) {
    try {
      const settings = await Settings.getSettings();
      return settings[category] || null;
    } catch (error) {
      throw new Error(`Error fetching ${category} settings: ${error.message}`);
    }
  },

  // Update specific setting category
  async updateSettingCategory(category, updates, userId = null) {
    try {
      const categoryUpdates = { [category]: updates };
      return await Settings.updateSettings(categoryUpdates, userId);
    } catch (error) {
      throw new Error(`Error updating ${category} settings: ${error.message}`);
    }
  },

  // Helper methods for common settings
  async getCompanyInfo() {
    try {
      const settings = await Settings.getSettings();
      return settings.company;
    } catch (error) {
      throw new Error(`Error fetching company info: ${error.message}`);
    }
  },

  async getFinancialSettings() {
    try {
      const settings = await Settings.getSettings();
      return settings.financial;
    } catch (error) {
      throw new Error(`Error fetching financial settings: ${error.message}`);
    }
  },

  async getInventorySettings() {
    try {
      const settings = await Settings.getSettings();
      return settings.inventory;
    } catch (error) {
      throw new Error(`Error fetching inventory settings: ${error.message}`);
    }
  },

  async getNotificationSettings() {
    try {
      const settings = await Settings.getSettings();
      return settings.notifications;
    } catch (error) {
      throw new Error(`Error fetching notification settings: ${error.message}`);
    }
  },

  // Generate ID based on settings (now returns info only)
  async getIdGenerationInfo(type) {
    try {
      const settings = await Settings.getSettings();
      const idInfo = settings.idGeneration[type];
      
      if (!idInfo) {
        throw new Error(`No ID information found for type: ${type}`);
      }

      return {
        info: idInfo.info,
        note: 'ID generation is handled automatically by the system'
      };
    } catch (error) {
      throw new Error(`Error getting ID info for ${type}: ${error.message}`);
    }
  },

  // Check if minimum price enforcement is enabled
  async isMinimumPriceEnforced() {
    try {
      const settings = await Settings.getSettings();
      return settings.inventory.minimumPriceEnforcement !== 'DISABLED';
    } catch (error) {
      return true; // Default to enforcing minimum price
    }
  },

  // Get minimum price enforcement type
  async getMinimumPriceEnforcementType() {
    try {
      const settings = await Settings.getSettings();
      return settings.inventory.minimumPriceEnforcement;
    } catch (error) {
      return 'WARNING'; // Default to warning
    }
  },

  // Check if overselling is allowed
  async isOverselling() {
    try {
      const settings = await Settings.getSettings();
      return settings.inventory.allowOverselling;
    } catch (error) {
      return false; // Default to not allowing overselling
    }
  },

  // Get low stock threshold
  async getLowStockThreshold() {
    try {
      const settings = await Settings.getSettings();
      return settings.inventory.lowStockThreshold;
    } catch (error) {
      return 10; // Default threshold
    }
  },

  // Get expiry warning days
  async getExpiryWarningDays() {
    try {
      const settings = await Settings.getSettings();
      return settings.inventory.expiryWarningDays;
    } catch (error) {
      return 90; // Default 90 days
    }
  },

  // Get currency settings
  async getCurrencySettings() {
    try {
      const settings = await Settings.getSettings();
      return {
        currency: settings.financial.currency,
        symbol: settings.financial.currencySymbol,
        decimalPlaces: settings.financial.decimalPlaces
      };
    } catch (error) {
      return {
        currency: 'PKR',
        symbol: 'Rs.',
        decimalPlaces: 2
      };
    }
  },

  // Format currency amount based on settings
  async formatCurrency(amount) {
    try {
      const currencySettings = await this.getCurrencySettings();
      const formattedAmount = amount.toFixed(currencySettings.decimalPlaces);
      return `${currencySettings.symbol} ${formattedAmount}`;
    } catch (error) {
      return `Rs. ${amount.toFixed(2)}`;
    }
  },

  // Reset settings to default
  async resetToDefaults(userId = null) {
    try {
      // Deactivate current settings
      await Settings.updateOne(
        { isActive: true },
        { isActive: false }
      );

      // Create new default settings
      const defaultSettings = new Settings({
        company: {
          name: 'Your Pharmaceutical Company',
          address: 'Your Company Address'
        },
        updatedBy: userId
      });

      return await defaultSettings.save();
    } catch (error) {
      throw new Error(`Error resetting settings: ${error.message}`);
    }
  },

  // Export settings for backup
  async exportSettings() {
    try {
      const settings = await Settings.getSettings();
      return settings.toObject();
    } catch (error) {
      throw new Error(`Error exporting settings: ${error.message}`);
    }
  },

  // Import settings from backup
  async importSettings(settingsData, userId = null) {
    try {
      // Deactivate current settings
      await Settings.updateOne(
        { isActive: true },
        { isActive: false }
      );

      // Create new settings from import
      const importedSettings = new Settings({
        ...settingsData,
        _id: undefined, // Remove ID to create new
        createdAt: undefined,
        updatedAt: undefined,
        updatedBy: userId,
        isActive: true
      });

      return await importedSettings.save();
    } catch (error) {
      throw new Error(`Error importing settings: ${error.message}`);
    }
  }
};

module.exports = settingsService;
