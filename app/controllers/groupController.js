const groupService = require('../services/groupService');
const { createResponse } = require('../util/util');

exports.getAllGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const brandId = req.query.brandId || "";
    
    const groups = await groupService.getAllGroups(page, limit, keyword, status, req.vendor.id, brandId);
    
    res.status(200).json(createResponse(groups, null, "All Groups"));
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await groupService.getGroupById(req.params.id, req.vendor.id);
    
    if (!group) {
      return res.status(404).json(createResponse(null, "Group not found"));
    }
    
    res.status(200).json(createResponse(group, null, "Group Found"));
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createGroup = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const groupData = { ...req.body, vendorId };

    // Validation - brandId and groupName are required
    const requiredFields = ['brandId', 'groupName'];
    const missingFields = requiredFields.filter(field => !groupData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Trim string fields
    if (groupData.groupName) groupData.groupName = groupData.groupName.trim();

    const createdGroup = await groupService.createGroup(groupData);
    
    res.status(201).json(createResponse(createdGroup, null, "Group created successfully"));
  } catch (error) {
    console.error('Create group error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.vendorId;

    // Trim string fields
    if (updateData.groupName) updateData.groupName = updateData.groupName.trim();

    const updatedGroup = await groupService.updateGroup(groupId, vendorId, updateData);
    
    res.status(200).json(createResponse(updatedGroup, null, "Group updated successfully"));
  } catch (error) {
    console.error('Update group error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const deletedGroup = await groupService.deleteGroup(id, vendorId);
    
    if (!deletedGroup) {
      return res.status(404).json(createResponse(null, "Group not found"));
    }

    res.status(200).json(createResponse(deletedGroup, null, "Group deleted successfully"));
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleGroupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const group = await groupService.toggleGroupStatus(id, vendorId);
    
    if (!group) {
      return res.status(404).json(createResponse(null, "Group not found"));
    }

    res.status(200).json(
      createResponse(group, null, `Group status ${group.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle group status error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};


