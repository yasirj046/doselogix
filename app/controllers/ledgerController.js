const LedgerService = require('../services/ledgerService');
const LedgerTransaction = require('../models/ledgerTransactionModel');
const LedgerSnapshot = require('../models/ledgerSnapshotModel');
const SeedService = require('../services/seedService');

class LedgerController {
  /**
   * Get ledger transactions with filters
   */
  static async getLedgerTransactions(req, res) {
    try {
      const vendorId = req.vendor.id;
      const {
        startDate,
        endDate,
        transactionType,
        customerId,
        paymentStatus,
        page = 1,
        limit = 50,
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        transactionType,
        customerId,
        paymentStatus,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await LedgerService.getLedgerTransactions(vendorId, filters);

      res.status(200).json({
        success: true,
        data: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          totalDocs: result.totalDocs,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage
        }
      });
    } catch (error) {
      console.error('Error getting ledger transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting ledger transactions',
        error: error.message
      });
    }
  }

  /**
   * Get ledger summary
   */
  static async getLedgerSummary(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { startDate, endDate } = req.query;

      // Convert dates if provided, otherwise let service handle defaults
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const summary = await LedgerService.getLedgerSummary(
        vendorId,
        start,
        end
      );

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting ledger summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting ledger summary',
        error: error.message
      });
    }
  }

  /**
   * Get customer summary
   */
  static async getCustomerSummary(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const summary = await LedgerService.getCustomerSummary(
        vendorId,
        new Date(startDate),
        new Date(endDate)
      );

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting customer summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting customer summary',
        error: error.message
      });
    }
  }

  /**
   * Get predefined date ranges
   */
  static async getPredefinedDateRanges(req, res) {
    try {
      const dateRanges = LedgerService.getPredefinedDateRanges();

      res.status(200).json({
        success: true,
        data: dateRanges
      });
    } catch (error) {
      console.error('Error getting predefined date ranges:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting predefined date ranges',
        error: error.message
      });
    }
  }

  /**
   * Get snapshots by date range
   */
  static async getSnapshots(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const snapshots = await LedgerService.getSnapshotsByDateRange(
        vendorId,
        new Date(startDate),
        new Date(endDate)
      );

      res.status(200).json({
        success: true,
        data: snapshots
      });
    } catch (error) {
      console.error('Error getting snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting snapshots',
        error: error.message
      });
    }
  }

  /**
   * Get latest snapshot
   */
  static async getLatestSnapshot(req, res) {
    try {
      const vendorId = req.vendor.id;
      const snapshot = await LedgerService.getLatestSnapshot(vendorId);

      res.status(200).json({
        success: true,
        data: snapshot
      });
    } catch (error) {
      console.error('Error getting latest snapshot:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting latest snapshot',
        error: error.message
      });
    }
  }

  /**
   * Create daily snapshot manually
   */
  static async createDailySnapshot(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { date } = req.body;

      const snapshotDate = date ? new Date(date) : new Date();
      const snapshot = await LedgerService.createDailySnapshot(vendorId, snapshotDate);

      res.status(201).json({
        success: true,
        data: snapshot,
        message: 'Daily snapshot created successfully'
      });
    } catch (error) {
      console.error('Error creating daily snapshot:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating daily snapshot',
        error: error.message
      });
    }
  }

  /**
   * Sync existing data to ledger with real-time progress
   */
  static async syncExistingData(req, res) {
    try {
      const vendorId = req.vendor.id;
      
      // Create a progress callback that sends updates via WebSocket
      const progressCallback = (progressData) => {
        console.log('📡 Emitting sync_progress to vendor_${vendorId}:', progressData);
        // Emit progress update to the client via WebSocket
        if (req.app.get('io')) {
          req.app.get('io').to(`vendor_${vendorId}`).emit('sync_progress', {
            vendorId,
            ...progressData
          });
          console.log('✅ sync_progress event emitted successfully');
        } else {
          console.error('❌ WebSocket io instance not found');
        }
      };

      // Start the sync process in the background
      LedgerService.syncExistingData(vendorId, progressCallback)
        .then(result => {
          console.log('🎉 Sync process completed, emitting sync_complete');
          // Send final completion message
          if (req.app.get('io')) {
            req.app.get('io').to(`vendor_${vendorId}`).emit('sync_complete', {
              vendorId,
              success: true,
              message: result.message,
              stats: result.stats
            });
            console.log('✅ sync_complete event emitted successfully');
          } else {
            console.error('❌ WebSocket io instance not found for completion');
          }
        })
        .catch(error => {
          console.error('💥 Sync process failed, emitting sync_error:', error.message);
          // Send error message
          if (req.app.get('io')) {
            req.app.get('io').to(`vendor_${vendorId}`).emit('sync_error', {
              vendorId,
              success: false,
              error: error.message
            });
            console.log('✅ sync_error event emitted successfully');
          } else {
            console.error('❌ WebSocket io instance not found for error');
          }
        });

      // Return immediately with sync started message
      res.status(200).json({
        success: true,
        message: 'Data sync started. You will receive real-time updates.',
        syncId: `sync_${vendorId}_${Date.now()}`
      });
    } catch (error) {
      console.error('Error starting sync process:', error);
      res.status(500).json({
        success: false,
        message: 'Error starting sync process',
        error: error.message
      });
    }
  }

  /**
   * Export ledger data in multiple formats
   */
  static async exportLedgerData(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { 
        startDate, 
        endDate, 
        format = 'json',
        includeSummary = true,
        includeTransactions = true,
        transactionType,
        paymentStatus,
        customerId
      } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      // Build filters for export
      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        transactionType,
        paymentStatus,
        customerId,
        limit: 10000 // Large limit for export
      };

      const exportData = await LedgerService.exportLedgerData(
        vendorId,
        filters,
        {
          format,
          includeSummary: includeSummary === 'true',
          includeTransactions: includeTransactions === 'true'
        }
      );

      // Set appropriate headers based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ledger-export-${timestamp}`;

      switch (format.toLowerCase()) {
        case 'pdf':
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
          res.send(exportData.buffer);
          break;
        
        case 'excel':
        case 'xlsx':
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
          res.send(exportData.buffer);
          break;
        
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
          res.send(exportData.csv);
          break;
        
        case 'json':
        default:
          res.status(200).json({
            success: true,
            data: exportData,
            metadata: {
              exportDate: new Date(),
              dateRange: { startDate, endDate },
              format,
              recordCount: exportData.transactions?.length || 0
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error exporting ledger data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting ledger data',
        error: error.message
      });
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { id } = req.params;

      const transaction = await LedgerTransaction.findOne({
        _id: id,
        vendorId,
        isActive: true
      }).populate('customerId', 'customerName customerAddress customerCity');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting transaction',
        error: error.message
      });
    }
  }

  /**
   * CDATA - Create master data only (no transactions)
   */
  static async createMasterData(req, res) {
    try {
      const vendorId = req.vendor.id;
      
      console.log(`🚀 Starting CDATA Master Only for vendor: ${vendorId}`);
      
      // Delete all existing data first
      await SeedService.deleteAllVendorData(vendorId);
      
      // Create master data only
      const result = await SeedService.createMasterData(vendorId);
      
      res.status(200).json({
        success: true,
        message: 'Master data created successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error creating master data:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating master data',
        error: error.message
      });
    }
  }

  /**
   * CDATA - Create master data with transactions
   */
  static async createMasterDataWithTransactions(req, res) {
    try {
      const vendorId = req.vendor.id;
      
      console.log(`🚀 Starting CDATA with Transactions for vendor: ${vendorId}`);
      
      // Delete all existing data first
      await SeedService.deleteAllVendorData(vendorId);
      
      // Create master data with transactions
      const result = await SeedService.createMasterDataWithTransactions(vendorId);
      
      res.status(200).json({
        success: true,
        message: 'Master data with transactions created successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error creating master data with transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating master data with transactions',
        error: error.message
      });
    }
  }

  /**
   * CDATA - Create comprehensive test data WITHOUT ledger transactions (for sync testing)
   */
  static async createComprehensiveTestData(req, res) {
    try {
      const vendorId = req.vendor.id;
      
      console.log(`🧪 Starting Comprehensive Test Data for vendor: ${vendorId}`);
      
      // Delete all existing data first
      await SeedService.deleteAllVendorData(vendorId);
      
      // Create comprehensive test data WITHOUT ledger transactions
      const result = await SeedService.createComprehensiveTestData(vendorId);
      
      res.status(200).json({
        success: true,
        message: 'Comprehensive test data created successfully (no ledger transactions - ready for sync)',
        data: result.data
      });
    } catch (error) {
      console.error('Error creating comprehensive test data:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating comprehensive test data',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard summary cards data
   */
  static async getDashboardSummary(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const summary = await LedgerService.getLedgerSummary(
        vendorId,
        new Date(startDate),
        new Date(endDate)
      );

      // Format data for dashboard cards
      const dashboardData = {
        totalCollected: summary.totalCashReceived || 0,
        totalPending: summary.totalReceivables || 0,
        totalPayable: summary.totalPayables || 0,
        netProfit: summary.netProfit || 0,
        netLoss: summary.netLoss || 0,
        totalSales: summary.totalSales || 0,
        totalPurchases: summary.totalPurchases || 0,
        totalExpenses: summary.totalExpenses || 0,
        transactionCounts: {
          total: summary.totalTransactions || 0,
          sales: summary.salesTransactions || 0,
          purchases: summary.purchaseTransactions || 0,
          expenses: summary.expenseTransactions || 0
        },
        paymentStatus: {
          paid: summary.paidTransactions || 0,
          partial: summary.partialTransactions || 0,
          unpaid: summary.unpaidTransactions || 0
        }
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting dashboard summary',
        error: error.message
      });
    }
  }
}

module.exports = LedgerController;
