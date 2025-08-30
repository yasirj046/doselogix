const Group = require('../models/groupModel');

exports.getAllGroups = async (page, limit, keyword, status, vendorId, brandId, group) => {
  try {
    let query = {};
    
    // Filter by vendor if provided
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Filter by brand if provided
    if (brandId && brandId !== "") {
      query.brandId = brandId;
    }
    
    // Filter by group if provided
    if (group && group !== "") {
      query.group = { $regex: group, $options: 'i' };
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Search functionality
    if (keyword && keyword !== "") {
      query.$or = [
        { group: { $regex: keyword, $options: 'i' } },
        { subGroup: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await Group.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        },
        {
          path: 'brandId',
          select: 'brandName'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    throw error;
  }
};

exports.getGroupById = async (id, vendorId) => {
  try {
    const group = await Group.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  } catch (error) {
    console.error('Error in getGroupById:', error);
    throw error;
  }
};

exports.createGroup = async (groupData) => {
  try {
    // Check if group with same name and sub group already exists for this vendor and brand
    const existingGroup = await Group.findOne({
      vendorId: groupData.vendorId,
      brandId: groupData.brandId,
      group: groupData.group,
      subGroup: groupData.subGroup
    });

    if (existingGroup) {
      throw new Error('Group with same name and sub group already exists for this brand');
    }

    const group = new Group(groupData);
    const savedGroup = await group.save();
    return await Group.findById(savedGroup._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    console.error('Error in createGroup:', error);
    throw error;
  }
};

exports.updateGroup = async (id, vendorId, groupData) => {
  try {
    // Don't allow updating vendorId
    delete groupData.vendorId;
    
    const group = await Group.findOneAndUpdate(
      { _id: id, vendorId: vendorId }, 
      groupData, 
      { new: true, runValidators: true }
    ).populate('vendorId', 'vendorName vendorEmail')
     .populate('brandId', 'brandName');
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    return group;
  } catch (error) {
    console.error('Error in updateGroup:', error);
    throw error;
  }
};

exports.deleteGroup = async (id, vendorId) => {
  try {
    return await Group.findOneAndDelete({ _id: id, vendorId });
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    throw error;
  }
};

exports.toggleGroupStatus = async (id, vendorId) => {
  try {
    // First find the current group to get current isActive state
    const currentGroup = await Group.findOne({ _id: id, vendorId: vendorId });
    if (!currentGroup) {
      return null;
    }

    // Toggle the isActive status
    const group = await Group.findOneAndUpdate(
      { _id: id, vendorId: vendorId },
      { isActive: !currentGroup.isActive },
      { 
        new: true,
        populate: [
          {
            path: 'vendorId',
            select: 'vendorName vendorEmail'
          },
          {
            path: 'brandId',
            select: 'brandName'
          }
        ]
      }
    );
    
    return group;
  } catch (error) {
    console.error('Error in toggleGroupStatus:', error);
    throw error;
  }
};

exports.getGroupsByVendor = async (vendorId, filters = {}) => {
  try {
    const query = { vendorId };
    
    // Apply additional filters
    if (filters.group) {
      query.group = { $regex: filters.group, $options: 'i' };
    }
    if (filters.brandId) {
      query.brandId = filters.brandId;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    return await Group.find(query)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .sort({ group: 1, subGroup: 1 });
  } catch (error) {
    console.error('Error in getGroupsByVendor:', error);
    throw error;
  }
};

exports.getGroupsByName = async (vendorId, groupName, brandId = null) => {
  try {
    let query = {
      vendorId,
      group: { $regex: groupName, $options: 'i' }
    };
    
    if (brandId) {
      query.brandId = brandId;
    }
    
    return await Group.find(query)
      .populate('brandId', 'brandName')
      .sort({ subGroup: 1 });
  } catch (error) {
    console.error('Error in getGroupsByName:', error);
    throw error;
  }
};

exports.getGroupsByBrand = async (vendorId, brandId) => {
  try {
    return await Group.find({ vendorId, brandId, isActive: true })
      .select('group subGroup')
      .sort({ group: 1, subGroup: 1 });
  } catch (error) {
    console.error('Error in getGroupsByBrand:', error);
    throw error;
  }
};

exports.getUniqueGroupsByBrand = async (vendorId, brandId) => {
  try {
    // Get unique groups for the specific brand
    const groups = await Group.distinct('group', { vendorId, brandId, isActive: true });
    
    return groups
      .filter(group => group && group.trim() !== '')
      .sort()
      .map(group => ({
        label: group,
        value: group
      }));
  } catch (error) {
    console.error('Error in getUniqueGroupsByBrand:', error);
    throw error;
  }
};

exports.getSubGroupsByGroup = async (vendorId, groupName, brandId = null) => {
  try {
    let query = { vendorId, isActive: true };
    
    if (groupName) {
      query.group = groupName;
    }
    
    if (brandId) {
      query.brandId = brandId;
    }
    
    // Get unique subgroups for the specific group
    const subGroups = await Group.distinct('subGroup', query);
    
    return subGroups
      .filter(subGroup => subGroup && subGroup.trim() !== '')
      .sort()
      .map(subGroup => ({
        label: subGroup,
        value: subGroup
      }));
  } catch (error) {
    console.error('Error in getSubGroupsByGroup:', error);
    throw error;
  }
};

exports.getAllUniqueGroups = async (vendorId, brandId = null) => {
  try {
    let query = { vendorId, isActive: true };
    
    if (brandId) {
      query.brandId = brandId;
    }
    
    // Get unique groups
    const groups = await Group.distinct('group', query);
    
    return groups
      .filter(group => group && group.trim() !== '')
      .sort()
      .map(group => ({
        label: group,
        value: group
      }));
  } catch (error) {
    console.error('Error in getAllUniqueGroups:', error);
    throw error;
  }
};
