const deliveryLogService = require('../services/deliveryLogService');
const { createResponse } = require('../util/util');

exports.getAllDeliveryLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const salesmanId = req.query.salesmanId || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const status = req.query.status || "";
    const vendorId = req.vendor.id;

    const result = await deliveryLogService.getAllDeliveryLogs(
      page, 
      limit, 
      keyword, 
      vendorId, 
      salesmanId, 
      startDate, 
      endDate,
      status
    );
    
    res.status(200).json(
      createResponse(result, null, "Delivery logs retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllDeliveryLogs:', error);
    res.status(200).json(createResponse([], error));
  }
};

exports.getDeliveryLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const deliveryLog = await deliveryLogService.getDeliveryLogById(id, vendorId);
    
    if (!deliveryLog) {
      return res.status(200).json(createResponse(null, { message: "No Delivery Log Found" }));
    }

    res.status(200).json(
      createResponse(deliveryLog, null, "Delivery log retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getDeliveryLogById:', error);
    res.status(200).json(createResponse(null, error));
  }
};

exports.createDeliveryLog = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const deliveryLogData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['salesmanId', 'date'];
    const missingFields = requiredFields.filter(field => !deliveryLogData[field]);
    
    if (missingFields.length > 0) {
      return res.status(200).json(
        createResponse(null, { 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        })
      );
    }

    // Validate date
    if (deliveryLogData.date && isNaN(new Date(deliveryLogData.date))) {
      return res.status(200).json(
        createResponse(null, { message: "Please provide a valid date" })
      );
    }

    const createdDeliveryLog = await deliveryLogService.createDeliveryLog(deliveryLogData);
    
    res.status(200).json(createResponse(createdDeliveryLog, null, "Delivery log created successfully"));
  } catch (error) {
    console.error('Create delivery log error:', error);
    res.status(200).json(createResponse(null, error));
  }
};

exports.updateDeliveryLog = async (req, res) => {
  try {
    const deliveryLogId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Validate date if being updated
    if (updateData.date && isNaN(new Date(updateData.date))) {
      return res.status(200).json(
        createResponse(null, { message: "Please provide a valid date" })
      );
    }

    const updatedDeliveryLog = await deliveryLogService.updateDeliveryLog(vendorId, deliveryLogId, updateData);
    
    res.status(200).json(
      createResponse(updatedDeliveryLog, null, "Delivery log updated successfully")
    );
  } catch (error) {
    console.error('Update delivery log error:', error);
    res.status(200).json(createResponse(null, error));
  }
};

exports.deleteDeliveryLog = async (req, res) => {
  try {
    const deliveryLogId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await deliveryLogService.deleteDeliveryLog(vendorId, deliveryLogId);
    
    res.status(200).json(
      createResponse(result, null, "Delivery log deleted successfully")
    );
  } catch (error) {
    console.error('Delete delivery log error:', error);
    res.status(200).json(createResponse(null, error));
  }
};

exports.recalculateTotal = async (req, res) => {
  try {
    const deliveryLogId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedDeliveryLog = await deliveryLogService.recalculateTotal(vendorId, deliveryLogId);
    
    res.status(200).json(
      createResponse(updatedDeliveryLog, null, "Delivery log total recalculated successfully")
    );
  } catch (error) {
    console.error('Recalculate total error:', error);
    res.status(200).json(createResponse(null, error));
  }
};

exports.getDeliveryLogsByDateRange = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate, salesmanId } = req.query;

    const deliveryLogs = await deliveryLogService.getDeliveryLogsByDateRange(
      vendorId, 
      startDate, 
      endDate, 
      salesmanId
    );
    
    res.status(200).json(
      createResponse(deliveryLogs, null, "Delivery logs retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getDeliveryLogsByDateRange:', error);
    res.status(200).json(createResponse(null, error));
  }
};

exports.getDeliveryLogStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate } = req.query;

    const stats = await deliveryLogService.getDeliveryLogStats(vendorId, startDate, endDate);
    
    res.status(200).json(
      createResponse(stats, null, "Delivery log statistics retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getDeliveryLogStats:', error);
    res.status(200).json(createResponse(null, error));
  }
};

// Get delivery log number for a salesman on a specific date (preview only)
exports.getDeliveryLogNumber = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { salesmanId, date } = req.query;

    if (!salesmanId) {
      return res.status(200).json(
        createResponse(null, { message: "Salesman ID is required" })
      );
    }

    const deliveryDate = date ? new Date(date) : new Date();

    const deliveryLogNumber = await deliveryLogService.getOrGenerateDeliveryLogNumber(
      vendorId,
      salesmanId,
      deliveryDate
    );
    
    res.status(200).json(
      createResponse(
        { deliveryLogNumber, salesmanId, date: deliveryDate },
        null,
        "Delivery log number retrieved successfully"
      )
    );
  } catch (error) {
    console.error('Error in getDeliveryLogNumber:', error);
    res.status(200).json(createResponse(null, error));
  }
};

// Toggle delivery log active status
exports.toggleDeliveryLogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const deliveryLog = await deliveryLogService.toggleDeliveryLogStatus(id, vendorId);
    
    if (!deliveryLog) {
      return res.status(200).json(
        createResponse(null, { message: "Delivery log not found" })
      );
    }

    res.status(200).json(
      createResponse(deliveryLog, null, "Delivery log status updated successfully")
    );
  } catch (error) {
    console.error('Error in toggleDeliveryLogStatus:', error);
    res.status(200).json(createResponse(null, error));
  }
};

// Sync unlinked sales invoices into delivery logs
exports.syncMissingInvoices = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    // Pass io instance so service can emit progress events to the vendor room
    const io = req.app.get('io');
    const result = await deliveryLogService.syncMissingInvoices(vendorId, io);

    res.status(200).json(createResponse(result, null, 'Sync completed'));
  } catch (error) {
    console.error('Error in syncMissingInvoices:', error);
    res.status(200).json(createResponse(null, error));
  }
};
