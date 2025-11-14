const LedgerTransaction = require('../models/ledgerTransactionModel');
const LedgerSnapshot = require('../models/ledgerSnapshotModel');
const SalesInvoice = require('../models/salesInvoiceModel');
const PurchaseEntry = require('../models/purchaseEntryModel');
const Expense = require('../models/expenseModel');
const UserCustomer = require('../models/userCustomersModel');

class LedgerService {
  /**
   * Map payment status from model format to ledger format
   */
  static mapPaymentStatus(status) {
    const statusMap = {
      'Paid': 'PAID',
      'Partial': 'PARTIAL', 
      'Unpaid': 'UNPAID'
    };
    return statusMap[status] || 'UNPAID';
  }

  /**
   * Create ledger transaction from sales invoice
   */
  static async createTransactionFromSalesInvoice(salesInvoice) {
    try {
      // Get customer details
      const customer = await UserCustomer.findById(salesInvoice.customerId);
      
      // Calculate payment status and remaining balance
      const totalPaid = salesInvoice.cash + (salesInvoice.paymentDetails?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0);
      const remainingBalance = salesInvoice.grandTotal - totalPaid;
      
      let paymentStatus = 'UNPAID';
      if (totalPaid >= salesInvoice.grandTotal) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL';
      }
      
      const transaction = new LedgerTransaction({
        vendorId: salesInvoice.vendorId,
        transactionDate: salesInvoice.date,
        transactionType: 'SALES_INVOICE',
        referenceId: salesInvoice._id,
        referenceNumber: salesInvoice.deliveryLogNumber,
        customerId: salesInvoice.customerId,
        customerName: customer ? customer.customerName : 'Unknown Customer',
        description: `Sales Invoice - ${salesInvoice.deliveryLogNumber}`,
        debitAmount: salesInvoice.grandTotal, // Money coming in (debit)
        creditAmount: 0,
        cashAmount: totalPaid, // Use total paid amount (initial cash + all payments)
        creditPaymentAmount: remainingBalance, // Set to remaining balance, not initial credit
        paymentStatus: paymentStatus
      });
      
      const savedTransaction = await transaction.save();
      
      return savedTransaction;
    } catch (error) {
      console.error('Error creating transaction from sales invoice:', error);
      throw error;
    }
  }

  /**
   * Create ledger transaction from purchase entry
   */
  static async createTransactionFromPurchaseEntry(purchaseEntry) {
    try {
      // Calculate payment status and remaining balance
      const totalPaid = (purchaseEntry.paymentDetails?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0);
      const remainingBalance = purchaseEntry.grandTotal - totalPaid;
      
      let paymentStatus = 'UNPAID';
      if (totalPaid >= purchaseEntry.grandTotal) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL';
      }
      
      const transaction = new LedgerTransaction({
        vendorId: purchaseEntry.vendorId,
        transactionDate: purchaseEntry.date,
        transactionType: 'PURCHASE_INVOICE',
        referenceId: purchaseEntry._id,
        referenceNumber: purchaseEntry.invoiceNumber,
        description: `Purchase Invoice - ${purchaseEntry.invoiceNumber}`,
        debitAmount: 0,
        creditAmount: purchaseEntry.grandTotal, // Money going out (credit)
        cashAmount: totalPaid, // Use total paid amount (initial cash + all payments)
        creditPaymentAmount: remainingBalance, // Set to remaining balance, not initial credit
        paymentStatus: paymentStatus
      });
      
      const savedTransaction = await transaction.save();
      
      return savedTransaction;
    } catch (error) {
      console.error('Error creating transaction from purchase entry:', error);
      throw error;
    }
  }

  /**
   * Create ledger transaction from expense
   */
  static async createTransactionFromExpense(expense) {
    try {
      const transaction = new LedgerTransaction({
        vendorId: expense.vendorId,
        transactionDate: expense.date,
        transactionType: 'EXPENSE',
        referenceId: expense._id,
        referenceNumber: `EXP-${expense._id.toString().slice(-6)}`,
        description: `Expense - ${expense.description}`,
        debitAmount: 0,
        creditAmount: expense.amount, // Money going out (credit)
        cashAmount: expense.amount,
        creditPaymentAmount: 0,
        paymentStatus: 'PAID' // Expenses are typically paid immediately
      });
      
      const savedTransaction = await transaction.save();
      
      return savedTransaction;
    } catch (error) {
      console.error('Error creating transaction from expense:', error);
      throw error;
    }
  }

  /**
   * Get ledger transactions with filters
   */
  static async getLedgerTransactions(vendorId, filters = {}) {
    try {
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
      } = filters;

      // Convert vendorId to ObjectId if it's a string
      const mongoose = require('mongoose');
      const vendorObjectId = typeof vendorId === 'string' ? new mongoose.Types.ObjectId(vendorId) : vendorId;

      const query = { vendorId: vendorObjectId, isActive: true };

      // Date filter
      if (startDate && endDate) {
        query.transactionDate = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        query.transactionDate = { $gte: startDate };
      } else if (endDate) {
        query.transactionDate = { $lte: endDate };
      }

      // Other filters
      if (transactionType) {
        query.transactionType = transactionType;
      }
      if (customerId) {
        query.customerId = customerId;
      }
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
        populate: [
          { path: 'customerId', select: 'customerName customerAddress customerCity' }
        ]
      };

      const result = await LedgerTransaction.paginate(query, options);
      return result;
    } catch (error) {
      console.error('Error getting ledger transactions:', error);
      throw error;
    }
  }

  /**
   * Get ledger summary for a date range
   */
  static async getLedgerSummary(vendorId, startDate, endDate) {
    try {
      // Set default date range to current month if not provided
      if (!startDate || !endDate) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        startDate = startDate || firstDayOfMonth;
        endDate = endDate || lastDayOfMonth;
      }
      
      // Convert vendorId to ObjectId if it's a string
      const mongoose = require('mongoose');
      const vendorObjectId = typeof vendorId === 'string' ? new mongoose.Types.ObjectId(vendorId) : vendorId;
      
      console.log(`Getting ledger summary for vendor ${vendorId} (${vendorObjectId}) from ${startDate} to ${endDate}`);
      
      const summary = await LedgerTransaction.getLedgerSummary(vendorObjectId, startDate, endDate);
      console.log('Raw summary from aggregation:', summary);
      
      // Calculate additional metrics
      const totalSales = summary.totalDebit || 0; // Total money coming in (sales)
      const totalPurchases = summary.totalCredit || 0; // Total money going out (purchases + expenses)
      const totalCashReceived = summary.totalCash || 0; // Total cash received
      
      // Use aggregated fields returned by LedgerTransaction.getLedgerSummary
      // which already computes cash-in/cash-out and receivable/payable splits
      const netProfit = summary.totalDebit - summary.totalCredit;

      const enhancedSummary = {
        // Basic totals
        totalSales: totalSales,
        totalPurchases: totalPurchases,
        // expenses can be derived as part of totalCredit for EXPENSE type but
        // keep a separate field if needed (fallback to 0)
        totalExpenses: summary.totalExpenses || 0,
        // Cash metrics
        totalCashReceived: summary.totalCashReceived || 0, // cash from sales (inflow)
        totalCashOut: summary.totalCashOut || 0, // cash paid out (purchases + expenses)

        // Credit tracking
        totalReceivables: summary.totalReceivable || 0,
        totalPayables: summary.totalPayable || 0,

        // Profit/Loss calculation
        netProfit: netProfit,
        netLoss: netProfit < 0 ? Math.abs(netProfit) : 0,

        // Transaction counts
        totalTransactions: summary.totalTransactions || 0,
        salesTransactions: summary.salesTransactions || 0,
        purchaseTransactions: summary.purchaseTransactions || 0,
        expenseTransactions: summary.expenseTransactions || 0,

        // Payment status counts
        paidTransactions: summary.paidTransactions || 0,
        partialTransactions: summary.partialTransactions || 0,
        unpaidTransactions: summary.unpaidTransactions || 0,

        // Additional metrics
        totalDebit: summary.totalDebit || 0,
        totalCredit: summary.totalCredit || 0,
        // Preserve raw aggregated fields for debugging/consumption
        totalCashIn: summary.totalCashIn || 0,
        totalCashOutRaw: summary.totalCashOut || 0,
        totalCreditPaymentAmount: summary.totalCreditPaymentAmount || 0,

        // Date range
        dateRange: {
          startDate: startDate,
          endDate: endDate
        }
      };
      
      console.log('Enhanced summary:', enhancedSummary);
      return enhancedSummary;
    } catch (error) {
      console.error('Error getting ledger summary:', error);
      throw error;
    }
  }

  /**
   * Get customer-wise summary
   */
  static async getCustomerSummary(vendorId, startDate, endDate) {
    try {
      return await LedgerTransaction.getCustomerSummary(vendorId, startDate, endDate);
    } catch (error) {
      console.error('Error getting customer summary:', error);
      throw error;
    }
  }

  /**
   * Get predefined date ranges
   */
  static getPredefinedDateRanges() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);

    return {
      today: {
        label: 'Today',
        startDate: today,
        endDate: today
      },
      yesterday: {
        label: 'Yesterday',
        startDate: yesterday,
        endDate: yesterday
      },
      last7Days: {
        label: 'Last 7 Days',
        startDate: last7Days,
        endDate: today
      },
      last30Days: {
        label: 'Last 30 Days',
        startDate: last30Days,
        endDate: today
      },
      thisMonth: {
        label: 'This Month',
        startDate: thisMonthStart,
        endDate: today
      },
      lastMonth: {
        label: 'Last Month',
        startDate: lastMonthStart,
        endDate: lastMonthEnd
      },
      thisYear: {
        label: 'This Year',
        startDate: thisYearStart,
        endDate: today
      },
      lastYear: {
        label: 'Last Year',
        startDate: lastYearStart,
        endDate: lastYearEnd
      }
    };
  }

  /**
   * Create daily snapshot
   */
  static async createDailySnapshot(vendorId, date) {
    try {
      return await LedgerSnapshot.createDailySnapshot(vendorId, date);
    } catch (error) {
      console.error('Error creating daily snapshot:', error);
      throw error;
    }
  }

  /**
   * Get snapshots by date range
   */
  static async getSnapshotsByDateRange(vendorId, startDate, endDate) {
    try {
      return await LedgerSnapshot.getSnapshotsByDateRange(vendorId, startDate, endDate);
    } catch (error) {
      console.error('Error getting snapshots:', error);
      throw error;
    }
  }

  /**
   * Get latest snapshot
   */
  static async getLatestSnapshot(vendorId) {
    try {
      return await LedgerSnapshot.getLatestSnapshot(vendorId);
    } catch (error) {
      console.error('Error getting latest snapshot:', error);
      throw error;
    }
  }

  /**
   * Sync existing data to ledger with progress tracking
   */
  static async syncExistingData(vendorId, progressCallback = null) {
    try {
      console.log(`Starting data sync for vendor: ${vendorId}`);
      
      const syncStats = {
        salesInvoices: { total: 0, synced: 0, skipped: 0 },
        purchaseEntries: { total: 0, synced: 0, skipped: 0 },
        expenses: { total: 0, synced: 0, skipped: 0 },
        totalProcessed: 0,
        totalSynced: 0,
        totalSkipped: 0,
        errors: []
      };

      // Helper function to send progress updates
      const sendProgress = (step, message, progress = 0) => {
        if (progressCallback) {
          progressCallback({
            step,
            message,
            progress,
            stats: syncStats,
            timestamp: new Date().toISOString()
          });
        }
      };

      // Step 1: Check existing transactions
      sendProgress('CHECKING', 'Checking existing ledger transactions...', 5);
      const existingTransactions = await LedgerTransaction.find({ vendorId, isActive: true });
      console.log(`Found ${existingTransactions.length} existing ledger transactions`);

      // Step 2: Sync sales invoices
      sendProgress('SALES_INVOICES', 'Syncing sales invoices...', 10);
      const salesInvoices = await SalesInvoice.find({ vendorId, isActive: true });
      syncStats.salesInvoices.total = salesInvoices.length;
      console.log(`Found ${salesInvoices.length} sales invoices to sync`);
      
      for (let i = 0; i < salesInvoices.length; i++) {
        const invoice = salesInvoices[i];
        try {
          const existingTransaction = await LedgerTransaction.findOne({
            vendorId,
            transactionType: 'SALES_INVOICE',
            referenceId: invoice._id
          });
          
          if (!existingTransaction) {
            await this.createTransactionFromSalesInvoice(invoice);
            syncStats.salesInvoices.synced++;
            syncStats.totalSynced++;
          } else {
            syncStats.salesInvoices.skipped++;
            syncStats.totalSkipped++;
          }
        } catch (error) {
          console.error(`Error syncing sales invoice ${invoice._id}:`, error);
          syncStats.errors.push({
            type: 'SALES_INVOICE',
            id: invoice._id,
            error: error.message
          });
        }
        
        syncStats.totalProcessed++;
        const progress = 10 + (i / salesInvoices.length) * 30;
        sendProgress('SALES_INVOICES', `Processing sales invoice ${i + 1}/${salesInvoices.length}...`, progress);
      }

      // Step 3: Sync purchase entries
      sendProgress('PURCHASE_INVOICES', 'Syncing purchase invoices...', 40);
      const purchaseEntries = await PurchaseEntry.find({ vendorId, isActive: true });
      syncStats.purchaseEntries.total = purchaseEntries.length;
      console.log(`Found ${purchaseEntries.length} purchase entries to sync`);
      
      for (let i = 0; i < purchaseEntries.length; i++) {
        const entry = purchaseEntries[i];
        try {
          const existingTransaction = await LedgerTransaction.findOne({
            vendorId,
            transactionType: 'PURCHASE_INVOICE',
            referenceId: entry._id
          });
          
          if (!existingTransaction) {
            await this.createTransactionFromPurchaseEntry(entry);
            syncStats.purchaseEntries.synced++;
            syncStats.totalSynced++;
          } else {
            syncStats.purchaseEntries.skipped++;
            syncStats.totalSkipped++;
          }
        } catch (error) {
          console.error(`Error syncing purchase entry ${entry._id}:`, error);
          syncStats.errors.push({
            type: 'PURCHASE_INVOICE',
            id: entry._id,
            error: error.message
          });
        }
        
        syncStats.totalProcessed++;
        const progress = 40 + (i / purchaseEntries.length) * 30;
        sendProgress('PURCHASE_INVOICES', `Processing purchase invoice ${i + 1}/${purchaseEntries.length}...`, progress);
      }

      // Step 4: Sync expenses
      sendProgress('EXPENSES', 'Syncing expenses...', 70);
      const expenses = await Expense.find({ vendorId, isActive: true });
      syncStats.expenses.total = expenses.length;
      console.log(`Found ${expenses.length} expenses to sync`);
      
      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        try {
          const existingTransaction = await LedgerTransaction.findOne({
            vendorId,
            transactionType: 'EXPENSE',
            referenceId: expense._id
          });
          
          if (!existingTransaction) {
            await this.createTransactionFromExpense(expense);
            syncStats.expenses.synced++;
            syncStats.totalSynced++;
          } else {
            syncStats.expenses.skipped++;
            syncStats.totalSkipped++;
          }
        } catch (error) {
          console.error(`Error syncing expense ${expense._id}:`, error);
          syncStats.errors.push({
            type: 'EXPENSE',
            id: expense._id,
            error: error.message
          });
        }
        
        syncStats.totalProcessed++;
        const progress = 70 + (i / expenses.length) * 20;
        sendProgress('EXPENSES', `Processing expense ${i + 1}/${expenses.length}...`, progress);
      }

      // Step 5: Complete
      sendProgress('COMPLETED', 'Data sync completed successfully!', 100);
      console.log(`Data sync completed for vendor: ${vendorId}`);
      
      return { 
        success: true, 
        message: 'Data sync completed successfully',
        stats: syncStats
      };
    } catch (error) {
      console.error('Error syncing existing data:', error);
      if (progressCallback) {
        progressCallback({
          step: 'ERROR',
          message: `Sync failed: ${error.message}`,
          progress: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  }

  /**
   * Update existing ledger transaction when invoice is updated
   */
  static async updateTransactionFromInvoice(vendorId, referenceId, transactionType) {
    try {
      // Find the existing ledger transaction
      const ledgerTransaction = await LedgerTransaction.findOne({
        vendorId,
        referenceId,
        transactionType
      });

      if (!ledgerTransaction) {
        console.log(`No ledger transaction found for ${transactionType} ${referenceId}`);
        return;
      }

      // Get the updated original transaction
      let originalTransaction;
      if (transactionType === 'SALES_INVOICE') {
        const SalesInvoice = require('../models/salesInvoiceModel');
        originalTransaction = await SalesInvoice.findById(referenceId);
      } else if (transactionType === 'PURCHASE_INVOICE') {
        const PurchaseEntry = require('../models/purchaseEntryModel');
        originalTransaction = await PurchaseEntry.findById(referenceId);
      }

      if (!originalTransaction) {
        console.log(`Original ${transactionType} not found: ${referenceId}`);
        return;
      }

      // Recalculate all values based on updated invoice
      let totalPaid = 0;
      let remainingBalance = 0;
      let paymentStatus = 'UNPAID';
      let totalCashAmount = 0;

      if (transactionType === 'SALES_INVOICE') {
        // Update reference number if changed
        if (ledgerTransaction.referenceNumber !== originalTransaction.salesInvoiceNumber) {
          ledgerTransaction.referenceNumber = originalTransaction.salesInvoiceNumber;
          ledgerTransaction.description = `Sales Invoice - ${originalTransaction.salesInvoiceNumber}`;
        }

        totalPaid = originalTransaction.cash + (originalTransaction.paymentDetails?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0);
        totalCashAmount = totalPaid; // Total cash amount should be the sum of initial cash + all payments
        remainingBalance = originalTransaction.grandTotal - totalPaid;
        
        if (totalPaid >= originalTransaction.grandTotal) {
          paymentStatus = 'PAID';
          remainingBalance = 0;
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL';
        }

        // Update sales invoice specific fields
        ledgerTransaction.debitAmount = originalTransaction.grandTotal;
        ledgerTransaction.cashAmount = totalCashAmount; // Use total cash amount instead of just initial cash
      } else if (transactionType === 'PURCHASE_INVOICE') {
        totalPaid = (originalTransaction.paymentDetails?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0);
        totalCashAmount = totalPaid; // Total cash amount should be the sum of all payments
        remainingBalance = originalTransaction.grandTotal - totalPaid;
        
        if (totalPaid >= originalTransaction.grandTotal) {
          paymentStatus = 'PAID';
          remainingBalance = 0;
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL';
        }

        // Update purchase invoice specific fields
        ledgerTransaction.creditAmount = originalTransaction.grandTotal;
        ledgerTransaction.cashAmount = totalCashAmount; // Use total cash amount instead of just initial cash
      }

      // Update the ledger transaction
      ledgerTransaction.paymentStatus = paymentStatus;
      ledgerTransaction.creditPaymentAmount = remainingBalance;
      await ledgerTransaction.save();

      console.log(`✓ Updated ledger transaction for ${transactionType} ${referenceId}: Status=${paymentStatus}, Remaining=${remainingBalance}`);
      return ledgerTransaction;
    } catch (error) {
      console.error('Error updating transaction from invoice:', error);
      throw error;
    }
  }

  /**
   * Update payment status and remaining balance of an existing ledger transaction
   */
  static async updateTransactionPaymentStatus(vendorId, referenceId, transactionType) {
    try {
      // Find the existing ledger transaction
      const ledgerTransaction = await LedgerTransaction.findOne({
        vendorId,
        referenceId,
        transactionType
      });

      if (!ledgerTransaction) {
        console.log(`No ledger transaction found for ${transactionType} ${referenceId}`);
        return;
      }

      // Get the original transaction to recalculate payment status and remaining balance
      let originalTransaction;
      if (transactionType === 'SALES_INVOICE') {
        const SalesInvoice = require('../models/salesInvoiceModel');
        originalTransaction = await SalesInvoice.findById(referenceId);
      } else if (transactionType === 'PURCHASE_INVOICE') {
        const PurchaseEntry = require('../models/purchaseEntryModel');
        originalTransaction = await PurchaseEntry.findById(referenceId);
      }

      if (!originalTransaction) {
        console.log(`Original ${transactionType} not found: ${referenceId}`);
        return;
      }

      // Recalculate payment status and remaining balance based on current payments
      let paymentStatus = 'UNPAID';
      let totalPaid = 0;
      let remainingBalance = 0;
      let totalCashAmount = 0;

      if (transactionType === 'SALES_INVOICE') {
        totalPaid = originalTransaction.cash + (originalTransaction.paymentDetails?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0);
        totalCashAmount = totalPaid; // Total cash amount should be the sum of initial cash + all payments
        remainingBalance = originalTransaction.grandTotal - totalPaid;
        
        if (totalPaid >= originalTransaction.grandTotal) {
          paymentStatus = 'PAID';
          remainingBalance = 0; // Ensure remaining balance is 0 when fully paid
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL';
        }
      } else if (transactionType === 'PURCHASE_INVOICE') {
        totalPaid = (originalTransaction.paymentDetails?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0);
        totalCashAmount = totalPaid; // Total cash amount should be the sum of all payments
        remainingBalance = originalTransaction.grandTotal - totalPaid;
        
        if (totalPaid >= originalTransaction.grandTotal) {
          paymentStatus = 'PAID';
          remainingBalance = 0; // Ensure remaining balance is 0 when fully paid
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL';
        }
      }

      // Update the ledger transaction with new payment status, remaining balance, and cash amount
      ledgerTransaction.paymentStatus = paymentStatus;
      ledgerTransaction.creditPaymentAmount = remainingBalance; // Update the remaining balance
      ledgerTransaction.cashAmount = totalCashAmount; // Update the total cash amount
      await ledgerTransaction.save();

      console.log(`✓ Updated ledger transaction for ${transactionType} ${referenceId}: Status=${paymentStatus}, Remaining=${remainingBalance}, Cash=${totalCashAmount}`);
      return ledgerTransaction;
    } catch (error) {
      console.error('Error updating transaction payment status:', error);
      throw error;
    }
  }

  /**
   * Export ledger data in multiple formats
   */
  static async exportLedgerData(vendorId, filters, options = {}) {
    try {
      const {
        format = 'json',
        includeSummary = true,
        includeTransactions = true
      } = options;

      // Get transactions data
      const transactionsResult = await this.getLedgerTransactions(vendorId, filters);
      const transactions = transactionsResult.docs || [];
      
      // Get summary data if requested
      let summary = null;
      if (includeSummary) {
        summary = await this.getLedgerSummary(vendorId, filters.startDate, filters.endDate);
      }

      // Base export data
      const exportData = {
        transactions: includeTransactions ? transactions : [],
        summary: includeSummary ? summary : null,
        dateRange: { 
          startDate: filters.startDate, 
          endDate: filters.endDate 
        },
        exportDate: new Date(),
        filters: {
          transactionType: filters.transactionType,
          paymentStatus: filters.paymentStatus,
          customerId: filters.customerId
        },
        options: {
          includeSummary,
          includeTransactions
        },
        metadata: {
          totalRecords: transactions.length,
          exportFormat: format,
          vendorId: vendorId
        }
      };

      // Generate format-specific data
      switch (format.toLowerCase()) {
        case 'pdf':
          return await this.generatePDFExport(exportData);
        
        case 'excel':
        case 'xlsx':
          return await this.generateExcelExport(exportData);
        
        case 'csv':
          return await this.generateCSVExport(exportData);
        
        case 'json':
        default:
          return exportData;
      }
    } catch (error) {
      console.error('Error exporting ledger data:', error);
      throw error;
    }
  }

  /**
   * Generate PDF export
   */
  static async generatePDFExport(exportData) {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'portrait'
      });
      
      // Create buffer to store PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({ buffer: pdfBuffer, format: 'pdf' });
        });
        
        doc.on('error', reject);
        
        // Generate PDF content
        this.generatePDFContent(doc, exportData);
        doc.end();
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF content
   */
  static generatePDFContent(doc, exportData) {
    // Set up fonts and margins
    const margin = 50;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    const pageHeight = doc.page.height;
    
    // Header
    doc.fontSize(24).text('Ledger Export Report', margin, margin, { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${exportData.exportDate.toLocaleDateString()}`, margin, margin + 30, { align: 'center' });
    doc.fontSize(10).text(`Date Range: ${exportData.dateRange.startDate.toLocaleDateString()} - ${exportData.dateRange.endDate.toLocaleDateString()}`, margin, margin + 45, { align: 'center' });
    
    let currentY = margin + 70;
    
    // Summary section
    if (exportData.summary) {
      doc.fontSize(16).text('Financial Summary', margin, currentY, { underline: true });
      currentY += 25;
      
      const summary = exportData.summary;
      doc.fontSize(11);
      
      // Create summary table
      const summaryData = [
        ['Total Sales', `PKR ${summary.totalSales?.toLocaleString() || '0'}`],
        ['Total Purchases', `PKR ${summary.totalPurchases?.toLocaleString() || '0'}`],
        ['Total Expenses', `PKR ${summary.totalExpenses?.toLocaleString() || '0'}`],
        ['Net Profit', `PKR ${summary.netProfit?.toLocaleString() || '0'}`],
        ['Total Transactions', `${summary.totalTransactions || '0'}`]
      ];
      
      // Draw summary table
      const col1 = margin;
      const col2 = margin + 200;
      const rowHeight = 20;
      
      summaryData.forEach((row, index) => {
        doc.text(row[0], col1, currentY);
        doc.text(row[1], col2, currentY);
        currentY += rowHeight;
      });
      
      currentY += 20;
    }
    
    // Transactions section
    if (exportData.transactions.length > 0) {
      // Check if we need a new page for transactions
      if (currentY > pageHeight - 150) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.fontSize(16).text('Transaction Details', margin, currentY, { underline: true });
      currentY += 25;
      
      // Table headers
      const colWidths = [80, 200, 100, 80, 80]; // Date, Description, Type, Debit, Credit
      const colPositions = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colPositions[i] = colPositions[i-1] + colWidths[i-1];
      }
      
      const headers = ['Date', 'Description', 'Type', 'Debit', 'Credit'];
      const headerY = currentY;
      
      // Draw header background
      doc.rect(margin, headerY - 5, contentWidth, 20).fill('#f5f5f5');
      
      // Draw header text
      doc.fontSize(9).fillColor('black');
      headers.forEach((header, index) => {
        doc.text(header, colPositions[index], headerY);
      });
      
      // Draw header border
      doc.rect(margin, headerY - 5, contentWidth, 20).stroke();
      
      currentY = headerY + 25;
      
      // Transaction rows
      exportData.transactions.forEach((transaction, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = margin + 20;
        }
        
        const rowData = [
          transaction.transactionDate.toLocaleDateString(),
          (transaction.description || 'N/A').substring(0, 25), // Truncate long descriptions
          (transaction.transactionType?.replace('_', ' ') || 'N/A').substring(0, 12),
          (transaction.debitAmount?.toLocaleString() || '0'),
          (transaction.creditAmount?.toLocaleString() || '0')
        ];
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(margin, currentY - 3, contentWidth, 16).fill('#fafafa');
        }
        
        // Draw row data
        doc.fontSize(8).fillColor('black');
        rowData.forEach((data, colIndex) => {
          doc.text(data, colPositions[colIndex], currentY);
        });
        
        // Draw row border
        doc.rect(margin, currentY - 3, contentWidth, 16).stroke();
        
        currentY += 18;
      });
    }
    
    // Footer - only add if we have content
    if (currentY < pageHeight - 50) {
      doc.fontSize(8).fillColor('gray');
      doc.text(`Total Records: ${exportData.metadata.totalRecords}`, margin, pageHeight - 30);
      doc.text(`Page ${doc.page.number}`, pageWidth - margin - 50, pageHeight - 30, { align: 'right' });
    }
  }

  /**
   * Generate Excel export
   */
  static async generateExcelExport(exportData) {
    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // Add metadata
      workbook.creator = 'DoseLogix';
      workbook.created = new Date();
      
      // Summary sheet
      if (exportData.summary) {
        const summarySheet = workbook.addWorksheet('Summary');
        const summary = exportData.summary;
        
        summarySheet.columns = [
          { header: 'Metric', key: 'metric', width: 20 },
          { header: 'Value', key: 'value', width: 20 }
        ];
        
        summarySheet.addRows([
          { metric: 'Total Sales', value: summary.totalSales || 0 },
          { metric: 'Total Purchases', value: summary.totalPurchases || 0 },
          { metric: 'Total Expenses', value: summary.totalExpenses || 0 },
          { metric: 'Net Profit', value: summary.netProfit || 0 },
          { metric: 'Total Transactions', value: summary.totalTransactions || 0 },
          { metric: 'Paid Transactions', value: summary.paidTransactions || 0 },
          { metric: 'Partial Transactions', value: summary.partialTransactions || 0 },
          { metric: 'Unpaid Transactions', value: summary.unpaidTransactions || 0 }
        ]);
        
        // Style the header
        summarySheet.getRow(1).font = { bold: true };
      }
      
      // Transactions sheet
      if (exportData.transactions.length > 0) {
        const transactionsSheet = workbook.addWorksheet('Transactions');
        
        transactionsSheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Description', key: 'description', width: 30 },
          { header: 'Type', key: 'type', width: 20 },
          { header: 'Customer', key: 'customer', width: 25 },
          { header: 'Debit Amount', key: 'debit', width: 15 },
          { header: 'Credit Amount', key: 'credit', width: 15 },
          { header: 'Payment Status', key: 'status', width: 15 },
          { header: 'Reference Number', key: 'reference', width: 20 }
        ];
        
        // Add transaction data
        exportData.transactions.forEach(transaction => {
          transactionsSheet.addRow({
            date: transaction.transactionDate,
            description: transaction.description || 'N/A',
            type: transaction.transactionType?.replace('_', ' '),
            customer: transaction.customerName || 'N/A',
            debit: transaction.debitAmount || 0,
            credit: transaction.creditAmount || 0,
            status: transaction.paymentStatus,
            reference: transaction.referenceNumber || 'N/A'
          });
        });
        
        // Style the header
        transactionsSheet.getRow(1).font = { bold: true };
        
        // Add totals row
        const totalRow = transactionsSheet.rowCount + 1;
        transactionsSheet.getCell(`E${totalRow}`).value = {
          formula: `SUM(E2:E${totalRow - 1})`
        };
        transactionsSheet.getCell(`F${totalRow}`).value = {
          formula: `SUM(F2:F${totalRow - 1})`
        };
        transactionsSheet.getRow(totalRow).font = { bold: true };
      }
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return { buffer: buffer, format: 'xlsx' };
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  }

  /**
   * Generate CSV export
   */
  static async generateCSVExport(exportData) {
    try {
      const csvRows = [];
      
      // Add summary as first section
      if (exportData.summary) {
        csvRows.push('Financial Summary');
        csvRows.push('Metric,Value');
        const summary = exportData.summary;
        csvRows.push(`Total Sales,${summary.totalSales || 0}`);
        csvRows.push(`Total Purchases,${summary.totalPurchases || 0}`);
        csvRows.push(`Total Expenses,${summary.totalExpenses || 0}`);
        csvRows.push(`Net Profit,${summary.netProfit || 0}`);
        csvRows.push(`Total Transactions,${summary.totalTransactions || 0}`);
        csvRows.push(''); // Empty row
      }
      
      // Add transactions
      if (exportData.transactions.length > 0) {
        csvRows.push('Transaction Details');
        csvRows.push('Date,Description,Type,Customer,Debit Amount,Credit Amount,Payment Status,Reference Number');
        
        exportData.transactions.forEach(transaction => {
          csvRows.push([
            transaction.transactionDate.toISOString().split('T')[0],
            `"${transaction.description || 'N/A'}"`,
            transaction.transactionType?.replace('_', ' '),
            `"${transaction.customerName || 'N/A'}"`,
            transaction.debitAmount || 0,
            transaction.creditAmount || 0,
            transaction.paymentStatus,
            `"${transaction.referenceNumber || 'N/A'}"`
          ].join(','));
        });
      }
      
      const csv = csvRows.join('\n');
      return { csv: csv, format: 'csv' };
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  }
}

module.exports = LedgerService;
