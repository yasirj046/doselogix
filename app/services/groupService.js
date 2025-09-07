const Group = require('../models/groupModel');

exports.getAllGroups = async (page, limit, keyword, status, vendorId, brandId) => {
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
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Search functionality
    if (keyword && keyword !== "") {
      query.$or = [
        { groupName: { $regex: keyword, $options: 'i' } }
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
    // Check if group with same name already exists for this vendor and brand
    const existingGroup = await Group.findOne({
      vendorId: groupData.vendorId,
      brandId: groupData.brandId,
      groupName: groupData.groupName
    });

    if (existingGroup) {
      throw new Error('Group with same name already exists for this brand');
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
    const group = await Group.findOneAndDelete({ _id: id, vendorId: vendorId });
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    throw error;
  }
};

exports.toggleGroupStatus = async (id, vendorId) => {
  try {
    const group = await Group.findOne({ _id: id, vendorId: vendorId });
    if (!group) {
      throw new Error('Group not found');
    }

    group.isActive = !group.isActive;
    await group.save();
    
    return await Group.findById(group._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName');
  } catch (error) {
    console.error('Error in toggleGroupStatus:', error);
    throw error;
  }
};


