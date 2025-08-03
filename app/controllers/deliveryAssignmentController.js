const deliveryAssignmentService = require("../services/deliveryAssignmentService");

const deliveryAssignmentController = {
  // Get all delivery assignments
  async getAllDeliveryAssignments(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        keyword = "", 
        startDate = "", 
        endDate = "",
        deliverBy = "",
        area = ""
      } = req.query;
      
      const result = await deliveryAssignmentService.getAllDeliveryAssignments(
        page, limit, keyword, startDate, endDate, deliverBy, area
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get delivery assignment by ID
  async getDeliveryAssignmentById(req, res) {
    try {
      const { id } = req.params;
      const deliveryAssignment = await deliveryAssignmentService.getDeliveryAssignmentById(id);
      
      res.status(200).json({
        success: true,
        data: deliveryAssignment
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get delivery assignments by deliveryman
  async getDeliveryAssignmentsByDeliveryman(req, res) {
    try {
      const { deliverymanId } = req.params;
      const { startDate = "", endDate = "" } = req.query;
      
      const assignments = await deliveryAssignmentService.getDeliveryAssignmentsByDeliveryman(
        deliverymanId, startDate, endDate
      );
      
      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get delivery statistics
  async getDeliveryStats(req, res) {
    try {
      const { startDate = "", endDate = "" } = req.query;
      const stats = await deliveryAssignmentService.getDeliveryStats(startDate, endDate);
      
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

  // Manual sync - Re-assign all invoices to delivery logs
  async syncInvoicesToDeliveryLogs(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      
      // This would be a maintenance function to sync existing invoices
      // Implementation would fetch all active invoices and create delivery assignments
      
      res.status(200).json({
        success: true,
        message: "Sync functionality would be implemented here for existing invoices"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Remove invoice from delivery log (manual operation)
  async removeInvoiceFromDeliveryLog(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user ? req.user.id : null;
      
      const result = await deliveryAssignmentService.removeInvoiceFromDeliveryLog(invoiceId, userId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "No delivery assignment found for this invoice"
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Invoice removed from delivery log successfully",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get delivery summary report (like the image you showed)
  async getDeliverySummaryReport(req, res) {
    try {
      const { 
        deliverymanId, 
        date, 
        startDate = "", 
        endDate = "" 
      } = req.query;
      
      let query = {};
      
      if (deliverymanId) {
        query.deliverBy = deliverymanId;
      }
      
      if (date) {
        // Specific date
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
        query.date = { $gte: targetDate, $lt: nextDay };
      } else if (startDate || endDate) {
        // Date range
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      const assignments = await deliveryAssignmentService.getAllDeliveryAssignments(
        1, 100, "", startDate, endDate, deliverymanId, ""
      );
      
      // Format the response to match the report structure
      const reportData = assignments.docs.map(assignment => ({
        deliveryLogNumber: assignment.deliveryLogNumber,
        date: assignment.date,
        deliverymanName: assignment.deliverymanName,
        deliverymanCode: assignment.deliverymanCode,
        deliveryArea: assignment.deliveryArea,
        bookedByName: assignment.bookedByName,
        totalInvoices: assignment.totalInvoices,
        totalAmount: assignment.totalAmount,
        totalCashReceived: assignment.totalCashReceived,
        totalCreditAmount: assignment.totalCreditAmount,
        invoices: assignment.invoices.map(invoice => ({
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          customerArea: invoice.customerArea,
          license: invoice.license,
          grandTotal: invoice.grandTotal,
          cashReceived: invoice.cashReceived,
          creditAmount: invoice.creditAmount,
          paymentStatus: invoice.paymentStatus,
          productCount: invoice.productCount,
          totalQuantity: invoice.totalQuantity
        }))
      }));
      
      res.status(200).json({
        success: true,
        data: {
          assignments: reportData,
          summary: {
            totalDeliveryLogs: assignments.totalDocs,
            totalPages: assignments.totalPages,
            currentPage: assignments.page,
            hasNextPage: assignments.hasNextPage,
            hasPrevPage: assignments.hasPrevPage
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = deliveryAssignmentController;
