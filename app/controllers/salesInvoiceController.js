const salesInvoiceService = require('../services/salesInvoiceService');
const SalesInvoice = require('../models/salesInvoiceModel');
const { createResponse } = require('../util/util');

exports.getAllSalesInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const customerId = req.query.customerId || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const paymentStatus = req.query.paymentStatus || "";
    const employeeId = req.query.employeeId || "";
    const vendorId = req.vendor.id;

    const result = await salesInvoiceService.getAllSalesInvoices(
      page, 
      limit, 
      keyword, 
      status, 
      vendorId, 
      customerId, 
      startDate, 
      endDate, 
      paymentStatus, 
      employeeId
    );
    
    res.status(200).json(
      createResponse(result, null, "Sales invoices retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllSalesInvoices:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getSalesInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const salesInvoice = await salesInvoiceService.getSalesInvoiceById(id, vendorId);
    
    if (!salesInvoice) {
      return res.status(404).json(createResponse(null, "Sales invoice not found"));
    }

    res.status(200).json(
      createResponse(salesInvoice, null, "Sales invoice retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesInvoiceById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createSalesInvoice = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const salesInvoiceData = { ...req.body, vendorId };

    // Validation
    if (!salesInvoiceData.customerId) {
      return res.status(400).json(createResponse(null, "Customer ID is required"));
    }

    if (!salesInvoiceData.deliverBy) {
      return res.status(400).json(createResponse(null, "Deliver by employee is required"));
    }

    if (!salesInvoiceData.bookedBy) {
      return res.status(400).json(createResponse(null, "Booked by employee is required"));
    }

    if (!salesInvoiceData.products || salesInvoiceData.products.length === 0) {
      return res.status(400).json(createResponse(null, "At least one product is required"));
    }

    // Trim string fields
    if (salesInvoiceData.licenseNumber) salesInvoiceData.licenseNumber = salesInvoiceData.licenseNumber.trim();
    if (salesInvoiceData.deliveryLogNumber) salesInvoiceData.deliveryLogNumber = salesInvoiceData.deliveryLogNumber.trim();
    if (salesInvoiceData.remarks) salesInvoiceData.remarks = salesInvoiceData.remarks.trim();

    const createdSalesInvoice = await salesInvoiceService.createSalesInvoice(salesInvoiceData);
    
    res.status(201).json(createResponse(createdSalesInvoice, null, "Sales invoice created successfully"));
  } catch (error) {
    console.error('Create sales invoice error:', error);

    // Handle specific error cases
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.message.includes('not found')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    if (error.message.includes('Insufficient inventory')) {
      return res.status(400).json(createResponse(null, error.message));
    }
    if (error.message.includes('below minimum price')) {
      return res.status(400).json(createResponse(null, error.message));
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json(createResponse(null, Object.values(error.errors).map(err => err.message).join(', ')));
    }

    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateSalesInvoice = async (req, res) => {
  try {
    const salesInvoiceId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Trim string fields
    if (updateData.licenseNumber) updateData.licenseNumber = updateData.licenseNumber.trim();
    if (updateData.deliveryLogNumber) updateData.deliveryLogNumber = updateData.deliveryLogNumber.trim();
    if (updateData.remarks) updateData.remarks = updateData.remarks.trim();

    const updatedSalesInvoice = await salesInvoiceService.updateSalesInvoice(vendorId, salesInvoiceId, updateData);
    
    res.status(200).json(
      createResponse(updatedSalesInvoice, null, "Sales invoice updated successfully")
    );
  } catch (error) {
    console.error('Update sales invoice error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.message === 'Sales invoice not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    if (error.message.includes('Insufficient inventory')) {
      return res.status(400).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteSalesInvoice = async (req, res) => {
  try {
    const salesInvoiceId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await salesInvoiceService.deleteSalesInvoice(vendorId, salesInvoiceId);
    
    res.status(200).json(
      createResponse(result, null, "Sales invoice deleted successfully")
    );
  } catch (error) {
    console.error('Delete sales invoice error:', error);
    if (error.message === 'Sales invoice not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleSalesInvoiceStatus = async (req, res) => {
  try {
    const salesInvoiceId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedSalesInvoice = await salesInvoiceService.toggleSalesInvoiceStatus(vendorId, salesInvoiceId);
    
    res.status(200).json(
      createResponse(updatedSalesInvoice, null, `Sales invoice ${updatedSalesInvoice.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle sales invoice status error:', error);
    if (error.message === 'Sales invoice not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesInvoicesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const vendorId = req.vendor.id;
    const customerId = req.query.customerId || null;
    const employeeId = req.query.employeeId || null;

    if (!startDate || !endDate) {
      return res.status(400).json(createResponse(null, "Start date and end date are required"));
    }

    const salesInvoices = await salesInvoiceService.getSalesInvoicesByDateRange(vendorId, startDate, endDate, customerId, employeeId);
    
    res.status(200).json(
      createResponse(salesInvoices, null, "Sales invoices by date range retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesInvoicesByDateRange:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getLastInvoiceByCustomer = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json(createResponse(null, "Customer ID is required"));
    }

    const lastInvoiceData = await salesInvoiceService.getLastInvoiceByCustomer(vendorId, customerId);
    
    res.status(200).json(
      createResponse(lastInvoiceData, null, "Last invoice data retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getLastInvoiceByCustomer:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.addPaymentToCredit = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const salesInvoiceId = req.params.id;
    const paymentData = req.body;

    if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
      return res.status(400).json(createResponse(null, "Valid payment amount is required"));
    }

    const result = await salesInvoiceService.addPaymentToCredit(vendorId, salesInvoiceId, paymentData);
    
    res.status(200).json(
      createResponse(result, null, "Payment added to credit successfully")
    );
  } catch (error) {
    console.error('Error in addPaymentToCredit:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.removePaymentFromCredit = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const salesInvoiceId = req.params.id;
    const { paymentIndex } = req.params;

    const result = await salesInvoiceService.removePaymentFromCredit(vendorId, salesInvoiceId, parseInt(paymentIndex));
    
    res.status(200).json(
      createResponse(result, null, "Payment removed from credit successfully")
    );
  } catch (error) {
    console.error('Error in removePaymentFromCredit:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getAvailableInventory = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json(createResponse(null, "Product ID is required"));
    }

    const inventory = await salesInvoiceService.getAvailableInventory(vendorId, productId);
    
    res.status(200).json(
      createResponse(inventory, null, "Available inventory retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAvailableInventory:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const stats = await salesInvoiceService.getSalesStats(vendorId);
    
    res.status(200).json(
      createResponse(stats, null, "Sales statistics retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesStats:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const vendorId = req.vendor.id;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const salesInvoices = await SalesInvoice.getSalesByCustomer(customerId, vendorId, options);
    
    res.status(200).json(
      createResponse(salesInvoices, null, "Sales invoices by customer retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesInvoicesByCustomer:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSalesInvoicesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const vendorId = req.vendor.id;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const salesInvoices = await SalesInvoice.getSalesByEmployee(employeeId, vendorId, options);
    
    res.status(200).json(
      createResponse(salesInvoices, null, "Sales invoices by employee retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getSalesInvoicesByEmployee:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getLastThreePricesForCustomer = async (req, res) => {
  try {
    const { customerId, productId } = req.query;
    const vendorId = req.vendor.id;

    if (!customerId || !productId) {
      return res.status(400).json(
        createResponse(null, "Customer ID and Product ID are required")
      );
    }

    const priceHistory = await salesInvoiceService.getLastThreePricesForCustomer(
      vendorId, 
      customerId, 
      productId
    );
    
    res.status(200).json(
      createResponse(priceHistory, null, "Price history retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getLastThreePricesForCustomer:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
