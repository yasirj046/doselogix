const subAreaService = require('../services/subAreaService');
const { createResponse } = require('../util/util');

exports.getAllSubAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const area = req.query.area || "";
    
    const subAreas = await subAreaService.getAllSubAreas(page, limit, keyword, status, req.vendor.id, area);
    
    res.status(200).json(createResponse(subAreas, null, "All Sub Areas"));
  } catch (error) {
    console.error('Get all sub areas error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubAreaById = async (req, res) => {
  try {
    const subArea = await subAreaService.getSubAreaById(req.params.id, req.vendor.id);
    
    if (!subArea) {
      return res.status(404).json(createResponse(null, "Sub area not found"));
    }
    
    res.status(200).json(createResponse(subArea, null, "Sub Area Found"));
  } catch (error) {
    console.error('Get sub area by ID error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createSubArea = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const subAreaData = { ...req.body, vendorId };

    // Validation - areaId and subAreaName are required
    const requiredFields = ['areaId', 'subAreaName'];
    const missingFields = requiredFields.filter(field => !subAreaData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Trim string fields
    if (subAreaData.subAreaName) subAreaData.subAreaName = subAreaData.subAreaName.trim();

    const createdSubArea = await subAreaService.createSubArea(subAreaData);
    
    res.status(201).json(createResponse(createdSubArea, null, "Sub area created successfully"));
  } catch (error) {
    console.error('Create sub area error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateSubArea = async (req, res) => {
  try {
    const subAreaId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.vendorId;

    // Trim string fields
    if (updateData.subAreaName) updateData.subAreaName = updateData.subAreaName.trim();

    const updatedSubArea = await subAreaService.updateSubArea(subAreaId, vendorId, updateData);
    
    res.status(200).json(createResponse(updatedSubArea, null, "Sub area updated successfully"));
  } catch (error) {
    console.error('Update sub area error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteSubArea = async (req, res) => {
  try {
    const deletedSubArea = await subAreaService.deleteSubArea(req.params.id);
    
    res.status(200).json(createResponse(deletedSubArea, null, "Sub area deleted successfully"));
  } catch (error) {
    console.error('Delete sub area error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleSubAreaStatus = async (req, res) => {
  try {
    const subAreaId = req.params.id;
    const vendorId = req.vendor.id;
    
    const updatedSubArea = await subAreaService.toggleSubAreaStatus(subAreaId, vendorId);
    
    const message = updatedSubArea.isActive ? "Sub area activated successfully" : "Sub area deactivated successfully";
    res.status(200).json(createResponse(updatedSubArea, null, message));
  } catch (error) {
    console.error('Toggle sub area status error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubAreasByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const filters = {
      areaId: req.query.areaId || "",
      isActive: req.query.isActive || ""
    };

    const subAreas = await subAreaService.getSubAreasByVendor(vendorId, filters);
    res.status(200).json(createResponse(subAreas, null, "Sub Areas by Vendor"));
  } catch (error) {
    console.error('Get sub areas by vendor error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getMySubAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const area = req.query.area || "";
    
    // Use vendor ID from middleware
    const vendorId = req.vendor.id;

    const subAreas = await subAreaService.getAllSubAreas(page, limit, keyword, status, vendorId, area);
    res.status(200).json(createResponse(subAreas, null, "My Sub Areas"));
  } catch (error) {
    console.error('Get my sub areas error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubAreasByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const vendorId = req.vendor.id;

    if (!areaId) {
      return res.status(400).json(
        createResponse(null, "Area ID is required")
      );
    }

    const subAreas = await subAreaService.getSubAreasByArea(vendorId, areaId);
    res.status(200).json(createResponse(subAreas, null, "Sub Areas by Area"));
  } catch (error) {
    console.error('Get sub areas by area error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubAreasByName = async (req, res) => {
  try {
    const { subAreaName } = req.params;
    const vendorId = req.vendor.id;

    if (!subAreaName) {
      return res.status(400).json(
        createResponse(null, "Sub area name is required")
      );
    }

    const subAreas = await subAreaService.getSubAreasByName(vendorId, subAreaName);
    res.status(200).json(createResponse(subAreas, null, "Sub Areas by Name"));
  } catch (error) {
    console.error('Get sub areas by name error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
