const inventoryService = require("../services/inventoryService");
const util = require("../util/util");

// Create new inventory entry
exports.createInventory = async (req, res) => {
  try {
    // Add companyId from authenticated user
    const inventoryData = {
      ...req.body,
      companyId: req.user.companyId
    };
    
    const inventory = await inventoryService.createInventory(inventoryData);
    res.status(201).json(
      util.createResponse(inventory, null, "Inventory created successfully")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Get all inventories
exports.getAllInventories = async (req, res) => {
  const page = parseInt(req.query.pageNumber) || 1;
  const limit = parseInt(req.query.pageSize) || 10;
  const keyword = req.query.keyword || "";
  const status = req.query.status || "active";
  const brandId = req.query.brandId || "";
  const startDate = req.query.startDate || "";
  const endDate = req.query.endDate || "";
  const companyId = req.user.companyId; // Multi-tenant filtering

  try {
    // Add no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': false
    });

    const result = await inventoryService.getAllInventories(page, limit, keyword, status, brandId, startDate, endDate, companyId);
    res.status(200).json(
      util.createResponse(result, null, "All Inventories")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse([], error)
    );
  }
};

// Get inventory by ID
exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
    res.status(200).json(
      util.createResponse(inventory, null, "Inventory retrieved successfully")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.updateInventory(req.params.id, req.body);
    res.status(200).json(
      util.createResponse(inventory, null, "Inventory updated successfully")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Delete inventory
exports.deleteInventory = async (req, res) => {
  try {
    const result = await inventoryService.deleteInventory(req.params.id);
    res.status(200).json(
      util.createResponse(result, null, "Inventory deleted successfully")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Get inventory statistics
exports.getInventoryStats = async (req, res) => {
  try {
    const stats = await inventoryService.getInventoryStats();
    res.status(200).json(
      util.createResponse(stats, null, "Inventory statistics retrieved successfully")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Update inventory payment (PIS approach)
exports.updateInventoryPayment = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null; // Assumes auth middleware sets req.user
    const inventory = await inventoryService.updateInventoryPayment(
      req.params.id, 
      req.body,
      userId
    );
    res.status(200).json(
      util.createResponse(inventory, null, "Payment updated successfully")
    );
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};
