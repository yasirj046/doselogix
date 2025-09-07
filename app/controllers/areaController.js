const areaService = require('../services/areaService');
const { createResponse } = require('../util/util');

exports.getAllAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const area = req.query.area || "";
    
    const areas = await areaService.getAllAreas(page, limit, keyword, status, req.vendor.id, area);
    
    res.status(200).json(createResponse(areas, null, "All Areas"));
  } catch (error) {
    console.error('Get all areas error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getAreaById = async (req, res) => {
  try {
    const area = await areaService.getAreaById(req.params.id, req.vendor.id);
    
    if (!area) {
      return res.status(404).json(createResponse(null, "Area not found"));
    }
    
    res.status(200).json(createResponse(area, null, "Area Found"));
  } catch (error) {
    console.error('Get area by ID error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createArea = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const areaData = { ...req.body, vendorId };

    // Validation - only area is required
    const requiredFields = ['area'];
    const missingFields = requiredFields.filter(field => !areaData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Trim string fields
    if (areaData.area) areaData.area = areaData.area.trim();

    const createdArea = await areaService.createArea(areaData);
    
    res.status(201).json(createResponse(createdArea, null, "Area created successfully"));
  } catch (error) {
    console.error('Create area error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateArea = async (req, res) => {
  try {
    const areaId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.vendorId;

    // Trim string fields
    if (updateData.area) updateData.area = updateData.area.trim();

    const updatedArea = await areaService.updateArea(areaId, vendorId, updateData);
    
    res.status(200).json(createResponse(updatedArea, null, "Area updated successfully"));
  } catch (error) {
    console.error('Update area error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const deletedArea = await areaService.deleteArea(req.params.id);
    
    res.status(200).json(createResponse(deletedArea, null, "Area deleted successfully"));
  } catch (error) {
    console.error('Delete area error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getAreasByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const filters = {
      area: req.query.area || undefined
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const areas = await areaService.getAreasByVendor(vendorId, filters);
    res.status(200).json(createResponse(areas, null, "Vendor Areas"));
  } catch (error) {
    console.error('Get areas by vendor error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getMyAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const area = req.query.area || "";
    
    // Use vendor ID from middleware
    const vendorId = req.vendor.id;

    const areas = await areaService.getAllAreas(page, limit, keyword, status, vendorId, area);
    res.status(200).json(createResponse(areas, null, "My Areas"));
  } catch (error) {
    console.error('Get my areas error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getAreasByName = async (req, res) => {
  try {
    const { area } = req.params;
    const vendorId = req.vendor.id;

    if (!area) {
      return res.status(400).json(
        createResponse(null, "Area name is required")
      );
    }

    const areas = await areaService.getAreasByName(vendorId, area);
    res.status(200).json(createResponse(areas, null, `Areas matching "${area}"`));
  } catch (error) {
    console.error('Get areas by name error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleAreaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const area = await areaService.toggleAreaStatus(id, vendorId);
    
    if (!area) {
      return res.status(404).json(createResponse(null, "Area not found"));
    }

    res.status(200).json(
      createResponse(area, null, `Area status ${area.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle area status error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
