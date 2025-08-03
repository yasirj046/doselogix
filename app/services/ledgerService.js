const Ledger = require("../models/ledgerModel");
const LedgerCounter = require("../models/ledgerCounterModel");

const ledgerService = {
  // Create payable ledger entry (from inventory)
  async createPayable(data) {
    try {
      const ledgerId = await LedgerCounter.getNext('PAYABLE');
      
      const payable = new Ledger({
        ledgerId,
        type: 'PAYABLE',
        date: data.date || new Date(),
        accountId: data.accountId,
        accountDetails: data.accountDetails,
        remarks: data.remarks || '',
        cash: data.cash || 0,
        credit: data.credit || 0,
        sourceType: data.sourceType || 'MANUAL',
        sourceId: data.sourceId || null,
        isActive: true
      });
      
      return await payable.save();
    } catch (error) {
      throw new Error(`Error creating payable: ${error.message}`);
    }
  },

  // Create receivable ledger entry (from invoice)
  async createReceivable(data) {
    try {
      const ledgerId = await LedgerCounter.getNext('RECEIVABLE');
      
      const receivable = new Ledger({
        ledgerId,
        type: 'RECEIVABLE',
        date: data.date || new Date(),
        accountId: data.accountId,
        accountDetails: data.accountDetails,
        remarks: data.remarks || '',
        cash: data.cash || 0,
        credit: data.credit || 0,
        sourceType: data.sourceType || 'MANUAL',
        sourceId: data.sourceId || null,
        isActive: true
      });
      
      return await receivable.save();
    } catch (error) {
      throw new Error(`Error creating receivable: ${error.message}`);
    }
  },

  // Create expense ledger entry
  async createExpense(data) {
    try {
      const ledgerId = await LedgerCounter.getNext('EXPENSE');
      
      const expense = new Ledger({
        ledgerId,
        type: 'EXPENSE',
        date: data.date || new Date(),
        accountDetails: data.accountDetails,
        remarks: data.remarks || '',
        expense: data.expense || 0,
        sourceType: 'MANUAL',
        isActive: true
      });
      
      return await expense.save();
    } catch (error) {
      throw new Error(`Error creating expense: ${error.message}`);
    }
  },

  // Get all payables with pagination and filters
  async getPayables(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        accountId = null,
        dateFrom = null,
        dateTo = null,
        sortBy = '-date'
      } = options;

      let query = { type: 'PAYABLE', isActive: true };

      // Add search filter
      if (search) {
        query.$or = [
          { ledgerId: { $regex: search, $options: 'i' } },
          { accountDetails: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } }
        ];
      }

      // Add account filter
      if (accountId) {
        query.accountId = accountId;
      }

      // Add date filters
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const result = await Ledger.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy,
        populate: [
          { path: 'lastEditedBy', select: 'name email' }
        ]
      });

      return {
        success: true,
        data: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.totalDocs,
          pages: result.totalPages
        }
      };
    } catch (error) {
      throw new Error(`Error fetching payables: ${error.message}`);
    }
  },

  // Get all receivables with pagination and filters
  async getReceivables(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        accountId = null,
        dateFrom = null,
        dateTo = null,
        sortBy = '-date'
      } = options;

      let query = { type: 'RECEIVABLE', isActive: true };

      // Add search filter
      if (search) {
        query.$or = [
          { ledgerId: { $regex: search, $options: 'i' } },
          { accountDetails: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } }
        ];
      }

      // Add account filter
      if (accountId) {
        query.accountId = accountId;
      }

      // Add date filters
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const result = await Ledger.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy,
        populate: [
          { path: 'lastEditedBy', select: 'name email' }
        ]
      });

      return {
        success: true,
        data: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.totalDocs,
          pages: result.totalPages
        }
      };
    } catch (error) {
      throw new Error(`Error fetching receivables: ${error.message}`);
    }
  },

  // Get all expenses with pagination and filters
  async getExpenses(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        dateFrom = null,
        dateTo = null,
        sortBy = '-date'
      } = options;

      let query = { type: 'EXPENSE', isActive: true };

      // Add search filter
      if (search) {
        query.$or = [
          { ledgerId: { $regex: search, $options: 'i' } },
          { accountDetails: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } }
        ];
      }

      // Add date filters
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const result = await Ledger.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy,
        populate: [
          { path: 'lastEditedBy', select: 'name email' }
        ]
      });

      return {
        success: true,
        data: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.totalDocs,
          pages: result.totalPages
        }
      };
    } catch (error) {
      throw new Error(`Error fetching expenses: ${error.message}`);
    }
  },

  // Get financial summary
  async getFinancialSummary() {
    try {
      return await Ledger.getFinancialSummary();
    } catch (error) {
      throw new Error(`Error fetching financial summary: ${error.message}`);
    }
  },

  // Update ledger entry
  async updateLedgerEntry(id, data, userId = null) {
    try {
      const ledgerEntry = await Ledger.findById(id);
      if (!ledgerEntry) {
        throw new Error('Ledger entry not found');
      }

      // Update fields
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && key !== '_id' && key !== 'ledgerId' && key !== 'type') {
          ledgerEntry[key] = data[key];
        }
      });

      // Mark as manually edited
      ledgerEntry.isManuallyEdited = true;
      if (userId) {
        ledgerEntry.lastEditedBy = userId;
      }

      return await ledgerEntry.save();
    } catch (error) {
      throw new Error(`Error updating ledger entry: ${error.message}`);
    }
  },

  // Get ledger entry by source
  async getLedgerBySource(sourceType, sourceId) {
    try {
      return await Ledger.findOne({
        sourceType,
        sourceId,
        isActive: true
      });
    } catch (error) {
      throw new Error(`Error fetching ledger by source: ${error.message}`);
    }
  },

  // Delete ledger entry (soft delete)
  async deleteLedgerEntry(id) {
    try {
      const ledgerEntry = await Ledger.findById(id);
      if (!ledgerEntry) {
        throw new Error('Ledger entry not found');
      }

      ledgerEntry.isActive = false;
      return await ledgerEntry.save();
    } catch (error) {
      throw new Error(`Error deleting ledger entry: ${error.message}`);
    }
  }
};

module.exports = ledgerService;
