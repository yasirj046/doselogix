const subGroupService = require('../services/subGroupService');
const { createResponse } = require('../util/util');

exports.getAllSubGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const groupId = req.query.groupId || "";
    const brandId = req.query.brandId || "";
    
    const subGroups = await subGroupService.getAllSubGroups(page, limit, keyword, status, req.vendor.id, groupId, brandId);
    
    res.status(200).json(createResponse(subGroups, null, "All Sub Groups"));
  } catch (error) {
    console.error('Get all sub groups error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubGroupById = async (req, res) => {
  try {
    const subGroup = await subGroupService.getSubGroupById(req.params.id, req.vendor.id);
    
    if (!subGroup) {
      return res.status(404).json(createResponse(null, "Sub group not found"));
    }
    
    res.status(200).json(createResponse(subGroup, null, "Sub Group Found"));
  } catch (error) {
    console.error('Get sub group by ID error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getMySubGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const groupId = req.query.groupId || "";
    const brandId = req.query.brandId || "";
    
    const subGroups = await subGroupService.getMySubGroups(page, limit, keyword, status, req.vendor.id, groupId, brandId);
    
    res.status(200).json(createResponse(subGroups, null, "My Sub Groups"));
  } catch (error) {
    console.error('Get my sub groups error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubGroupsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const vendorId = req.vendor.id;
    
    const subGroups = await subGroupService.getSubGroupsByGroup(groupId, vendorId);
    
    res.status(200).json(createResponse(subGroups, null, "Sub Groups by Group"));
  } catch (error) {
    console.error('Get sub groups by group error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubGroupsByName = async (req, res) => {
  try {
    const { subGroupName } = req.params;
    const vendorId = req.vendor.id;
    
    const subGroups = await subGroupService.getSubGroupsByName(subGroupName, vendorId);
    
    res.status(200).json(createResponse(subGroups, null, "Sub Groups by Name"));
  } catch (error) {
    console.error('Get sub groups by name error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createSubGroup = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const subGroupData = { ...req.body, vendorId };

    // Validation - groupId and subGroupName are required
    const requiredFields = ['groupId', 'subGroupName'];
    const missingFields = requiredFields.filter(field => !subGroupData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Trim string fields
    if (subGroupData.subGroupName) subGroupData.subGroupName = subGroupData.subGroupName.trim();

    const createdSubGroup = await subGroupService.createSubGroup(subGroupData);
    
    res.status(201).json(createResponse(createdSubGroup, null, "Sub group created successfully"));
  } catch (error) {
    console.error('Create sub group error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateSubGroup = async (req, res) => {
  try {
    const subGroupId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.vendorId;

    // Trim string fields
    if (updateData.subGroupName) updateData.subGroupName = updateData.subGroupName.trim();

    const updatedSubGroup = await subGroupService.updateSubGroup(subGroupId, vendorId, updateData);
    
    res.status(200).json(createResponse(updatedSubGroup, null, "Sub group updated successfully"));
  } catch (error) {
    console.error('Update sub group error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteSubGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const deletedSubGroup = await subGroupService.deleteSubGroup(id, vendorId);
    
    if (!deletedSubGroup) {
      return res.status(404).json(createResponse(null, "Sub group not found"));
    }

    res.status(200).json(createResponse(deletedSubGroup, null, "Sub group deleted successfully"));
  } catch (error) {
    console.error('Delete sub group error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleSubGroupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const subGroup = await subGroupService.toggleSubGroupStatus(id, vendorId);
    
    if (!subGroup) {
      return res.status(404).json(createResponse(null, "Sub group not found"));
    }

    res.status(200).json(
      createResponse(subGroup, null, `Sub group status ${subGroup.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle sub group status error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
