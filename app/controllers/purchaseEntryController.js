const purchaseEntryService = require('../services/purchaseEntryService');
const { createResponse } = require('../util/util');

exports.getAllPurchaseEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const brandId = req.query.brandId || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const vendorId = req.vendor.id;

    const result = await purchaseEntryService.getAllPurchaseEntries(page, limit, keyword, status, vendorId, brandId, startDate, endDate);
    
    res.status(200).json(
      createResponse(result, null, "Purchase entries retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllPurchaseEntries:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getPurchaseEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const purchaseEntry = await purchaseEntryService.getPurchaseEntryById(id, vendorId);
    
    if (!purchaseEntry) {
      return res.status(404).json(createResponse(null, "Purchase entry not found"));
    }

    res.status(200).json(
      createResponse(purchaseEntry, null, "Purchase entry retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getPurchaseEntryById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createPurchaseEntry = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const purchaseEntryData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['brandId', 'invoiceNumber', 'invoiceDate', 'grossTotal', 'grandTotal'];
    const missingFields = requiredFields.filter(field => !purchaseEntryData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Validate date fields
    if (purchaseEntryData.date) purchaseEntryData.date = new Date(purchaseEntryData.date);
    if (purchaseEntryData.invoiceDate) purchaseEntryData.invoiceDate = new Date(purchaseEntryData.invoiceDate);

    // Validate date values
    if (purchaseEntryData.date && isNaN(purchaseEntryData.date.getTime())) {
      return res.status(400).json(createResponse(null, 'Invalid purchase date format'));
    }
    if (purchaseEntryData.invoiceDate && isNaN(purchaseEntryData.invoiceDate.getTime())) {
      return res.status(400).json(createResponse(null, 'Invalid invoice date format'));
    }

    // Trim string fields
    if (purchaseEntryData.invoiceNumber) purchaseEntryData.invoiceNumber = purchaseEntryData.invoiceNumber.trim();
    if (purchaseEntryData.lastInvoiceNumber) purchaseEntryData.lastInvoiceNumber = purchaseEntryData.lastInvoiceNumber.trim();
    if (purchaseEntryData.remarks) purchaseEntryData.remarks = purchaseEntryData.remarks.trim();

    const createdPurchaseEntry = await purchaseEntryService.createPurchaseEntry(purchaseEntryData);
    
    res.status(201).json(createResponse(createdPurchaseEntry, null, "Purchase entry created successfully"));
  } catch (error) {
    console.error('Create purchase entry error:', error);

    // Handle specific error cases
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json(createResponse(null, Object.values(error.errors).map(err => err.message).join(', ')));
    }
    if (error.name === 'CastError') {
      return res.status(400).json(createResponse(null, 'Invalid ID format'));
    }
    if (error.code === 11000) {
      return res.status(409).json(createResponse(null, 'Duplicate entry found'));
    }

    // Generic error response
    res.status(500).json(createResponse(null, 'Failed to create purchase entry. Please try again.'));
  }
};

exports.updatePurchaseEntry = async (req, res) => {
  try {
    const purchaseEntryId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Validation for required fields if they're being updated
    const requiredFields = ['brandId', 'invoiceNumber', 'invoiceDate', 'grossTotal', 'grandTotal'];
    for (const field of requiredFields) {
      if (updateData.hasOwnProperty(field) && (!updateData[field] || updateData[field].toString().trim() === '')) {
        return res.status(400).json(
          createResponse(null, `${field} is required and cannot be empty`)
        );
      }
    }

    // Validate date fields if provided
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.invoiceDate) updateData.invoiceDate = new Date(updateData.invoiceDate);

    // Trim string fields if they exist in updateData
    const stringFields = ['invoiceNumber', 'lastInvoiceNumber', 'remarks'];
    stringFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = updateData[field].trim();
      }
    });

    const updatedPurchaseEntry = await purchaseEntryService.updatePurchaseEntry(vendorId, purchaseEntryId, updateData);
    
    res.status(200).json(
      createResponse(updatedPurchaseEntry, null, "Purchase entry updated successfully")
    );
  } catch (error) {
    console.error('Update purchase entry error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.message === 'Purchase entry not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deletePurchaseEntry = async (req, res) => {
  try {
    const purchaseEntryId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await purchaseEntryService.deletePurchaseEntry(vendorId, purchaseEntryId);
    
    res.status(200).json(
      createResponse(result, null, "Purchase entry deleted successfully")
    );
  } catch (error) {
    console.error('Delete purchase entry error:', error);
    if (error.message === 'Purchase entry not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.togglePurchaseEntryStatus = async (req, res) => {
  try {
    const purchaseEntryId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedPurchaseEntry = await purchaseEntryService.togglePurchaseEntryStatus(vendorId, purchaseEntryId);
    
    res.status(200).json(
      createResponse(updatedPurchaseEntry, null, `Purchase entry ${updatedPurchaseEntry.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle purchase entry status error:', error);
    if (error.message === 'Purchase entry not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getPurchaseEntriesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const vendorId = req.vendor.id;
    const brandId = req.query.brandId || null;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

    if (!startDate || !endDate) {
      return res.status(400).json(
        createResponse(null, "Start date and end date are required")
      );
    }

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (brandId) options.brandId = brandId;

    const purchaseEntries = await purchaseEntryService.getPurchaseEntriesByDateRange(vendorId, startDate, endDate, options);
    
    res.status(200).json(
      createResponse(purchaseEntries, null, "Purchase entries by date range retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getPurchaseEntriesByDateRange:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getPurchaseStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

    const options = {};
    if (isActive !== undefined) options.isActive = isActive;
    if (startDate && endDate) {
      options.startDate = new Date(startDate);
      options.endDate = new Date(endDate);
    }

    const stats = await purchaseEntryService.getPurchaseStats(vendorId, options);
    
    res.status(200).json(
      createResponse(stats, null, "Purchase statistics retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getPurchaseStats:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
