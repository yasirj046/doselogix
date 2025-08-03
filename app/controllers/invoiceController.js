const invoiceService = require("../services/invoiceService");

const invoiceController = {
  // Create new invoice
  async createInvoice(req, res) {
    try {
      const invoice = await invoiceService.createInvoice(req.body);
      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: invoice
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all invoices with pagination and filters
  async getAllInvoices(req, res) {
    try {
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: req.query.search || '',
        status: req.query.status || 'active',
        customerId: req.query.customerId || '',
        employeeId: req.query.employeeId || '',
        paymentStatus: req.query.paymentStatus || '',
        startDate: req.query.startDate || '',
        endDate: req.query.endDate || '',
        sortBy: req.query.sortBy || '-createdAt'
      };

      const result = await invoiceService.getAllInvoices(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get invoice by ID
  async getInvoiceById(req, res) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update invoice payment
  async updateInvoicePayment(req, res) {
    try {
      const userId = req.user ? req.user.id : null; // Assumes auth middleware sets req.user
      const invoice = await invoiceService.updateInvoicePayment(
        req.params.id, 
        req.body,
        userId
      );
      res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        data: invoice
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get invoice statistics
  async getInvoiceStats(req, res) {
    try {
      const stats = await invoiceService.getInvoiceStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete invoice
  async deleteInvoice(req, res) {
    try {
      const result = await invoiceService.deleteInvoice(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = invoiceController;
