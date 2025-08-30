const groupService = require('../services/groupService');
const { createResponse } = require('../util/util');

exports.getAllGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const brandId = req.query.brandId || "";
    const group = req.query.group || "";
    const vendorId = req.vendor.id;

    const result = await groupService.getAllGroups(page, limit, keyword, status, vendorId, brandId, group);
    
    res.status(200).json(
      createResponse(result, null, "Groups retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const group = await groupService.getGroupById(id, vendorId);
    
    if (!group) {
      return res.status(404).json(createResponse(null, "Group not found"));
    }

    res.status(200).json(
      createResponse(group, null, "Group retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getGroupById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createGroup = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const groupData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['brandId', 'group', 'subGroup'];
    const missingFields = requiredFields.filter(field => !groupData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Trim string fields
    if (groupData.group) groupData.group = groupData.group.trim();
    if (groupData.subGroup) groupData.subGroup = groupData.subGroup.trim();

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
    if (updateData.group) updateData.group = updateData.group.trim();
    if (updateData.subGroup) updateData.subGroup = updateData.subGroup.trim();

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

exports.getGroupsByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const filters = {
      group: req.query.group || undefined,
      brandId: req.query.brandId || undefined,
      isActive: req.query.isActive || undefined
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const groups = await groupService.getGroupsByVendor(vendorId, filters);
    res.status(200).json(createResponse(groups, null, "Vendor groups"));
  } catch (error) {
    console.error('Get groups by vendor error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const groups = await groupService.getGroupsByVendor(vendorId);
    
    res.status(200).json(createResponse(groups, null, "My Groups"));
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getGroupsByName = async (req, res) => {
  try {
    const { group } = req.params;
    const vendorId = req.vendor.id;
    const brandId = req.query.brandId || null;

    if (!group) {
      return res.status(400).json(
        createResponse(null, "Group name is required")
      );
    }

    const groups = await groupService.getGroupsByName(vendorId, group, brandId);
    res.status(200).json(createResponse(groups, null, `Groups matching "${group}"`));
  } catch (error) {
    console.error('Get groups by name error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getGroupsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const vendorId = req.vendor.id;

    if (!brandId) {
      return res.status(400).json(
        createResponse(null, "Brand ID is required")
      );
    }

    const groups = await groupService.getGroupsByBrand(vendorId, brandId);
    res.status(200).json(createResponse(groups, null, "Groups for brand"));
  } catch (error) {
    console.error('Get groups by brand error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getUniqueGroupsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const vendorId = req.vendor.id;

    if (!brandId) {
      return res.status(400).json(
        createResponse(null, "Brand ID is required")
      );
    }

    const groups = await groupService.getUniqueGroupsByBrand(vendorId, brandId);
    res.status(200).json(createResponse(groups, null, "Unique groups for brand"));
  } catch (error) {
    console.error('Get unique groups by brand error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getSubGroupsByGroup = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { group, brandId } = req.query;

    if (!group) {
      return res.status(400).json(
        createResponse(null, "Group name is required")
      );
    }

    const subGroups = await groupService.getSubGroupsByGroup(vendorId, group, brandId);
    res.status(200).json(createResponse(subGroups, null, "Sub groups for group"));
  } catch (error) {
    console.error('Get sub groups by group error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getAllUniqueGroups = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { brandId } = req.query;

    const groups = await groupService.getAllUniqueGroups(vendorId, brandId);
    res.status(200).json(createResponse(groups, null, "All unique groups"));
  } catch (error) {
    console.error('Get all unique groups error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
