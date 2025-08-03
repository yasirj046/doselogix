const ledgerService = require("../services/ledgerService");

const ledgerController = {
  // Get financial summary dashboard
  async getFinancialSummary(req, res) {
    try {
      const summary = await ledgerService.getFinancialSummary();
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all payables with pagination and filters
  async getPayables(req, res) {
    try {
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: req.query.search || '',
        accountId: req.query.accountId || null,
        dateFrom: req.query.dateFrom || null,
        dateTo: req.query.dateTo || null,
        sortBy: req.query.sortBy || '-date'
      };

      const result = await ledgerService.getPayables(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all receivables with pagination and filters
  async getReceivables(req, res) {
    try {
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: req.query.search || '',
        accountId: req.query.accountId || null,
        dateFrom: req.query.dateFrom || null,
        dateTo: req.query.dateTo || null,
        sortBy: req.query.sortBy || '-date'
      };

      const result = await ledgerService.getReceivables(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all expenses with pagination and filters
  async getExpenses(req, res) {
    try {
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: req.query.search || '',
        dateFrom: req.query.dateFrom || null,
        dateTo: req.query.dateTo || null,
        sortBy: req.query.sortBy || '-date'
      };

      const result = await ledgerService.getExpenses(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Create manual payable entry
  async createPayable(req, res) {
    try {
      const payable = await ledgerService.createPayable({
        ...req.body,
        sourceType: 'MANUAL'
      });
      res.status(201).json({
        success: true,
        message: "Payable entry created successfully",
        data: payable
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Create manual receivable entry
  async createReceivable(req, res) {
    try {
      const receivable = await ledgerService.createReceivable({
        ...req.body,
        sourceType: 'MANUAL'
      });
      res.status(201).json({
        success: true,
        message: "Receivable entry created successfully",
        data: receivable
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Create expense entry
  async createExpense(req, res) {
    try {
      const expense = await ledgerService.createExpense(req.body);
      res.status(201).json({
        success: true,
        message: "Expense entry created successfully",
        data: expense
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update ledger entry
  async updateLedgerEntry(req, res) {
    try {
      const userId = req.user ? req.user.id : null; // Assumes auth middleware sets req.user
      const ledgerEntry = await ledgerService.updateLedgerEntry(
        req.params.id,
        req.body,
        userId
      );
      res.status(200).json({
        success: true,
        message: "Ledger entry updated successfully",
        data: ledgerEntry
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete ledger entry
  async deleteLedgerEntry(req, res) {
    try {
      await ledgerService.deleteLedgerEntry(req.params.id);
      res.status(200).json({
        success: true,
        message: "Ledger entry deleted successfully"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = ledgerController;
