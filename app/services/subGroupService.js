const SubGroup = require('../models/subGroupModel');

exports.getAllSubGroups = async (page, limit, keyword, status, vendorId, groupId, brandId) => {
  try {
    let query = {};
    
    // Filter by vendor if provided
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Filter by group if provided (direct filter - this should work)
    if (groupId && groupId !== "") {
      query.groupId = groupId;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Search functionality
    if (keyword && keyword !== "") {
      query.$or = [
        { subGroupName: { $regex: keyword, $options: 'i' } }
      ];
    }

    // If brand filter is provided but no specific group is selected, 
    // we need to filter subgroups by all groups belonging to that brand
    if (brandId && brandId !== "" && (!groupId || groupId === "")) {
      // First get all groups that belong to the selected brand
      const Group = require('../models/groupModel');
      const groupsInBrand = await Group.find({ 
        brandId: brandId, 
        vendorId: vendorId, 
        isActive: true 
      }).select('_id');
      const groupIds = groupsInBrand.map(group => group._id);
      
      // Then filter subgroups by these group IDs
      if (groupIds.length > 0) {
        query.groupId = { $in: groupIds };
      } else {
        // If no groups found for this brand, return empty result
        return {
          docs: [],
          totalDocs: 0,
          limit: limit,
          page: page,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null
        };
      }
    }

    let populateOptions = [
      {
        path: 'vendorId',
        select: 'vendorName vendorEmail'
      },
      {
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      }
    ];

    const result = await SubGroup.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: populateOptions
    });

    return result;
  } catch (error) {
    console.error('Error in getAllSubGroups:', error);
    throw error;
  }
};

exports.getSubGroupById = async (id, vendorId) => {
  try {
    const subGroup = await SubGroup.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      });
    if (!subGroup) {
      throw new Error('Sub group not found');
    }
    return subGroup;
  } catch (error) {
    console.error('Error in getSubGroupById:', error);
    throw error;
  }
};

exports.getMySubGroups = async (page, limit, keyword, status, vendorId, groupId, brandId) => {
  try {
    let query = { vendorId };
    
    // Filter by group if provided (direct filter - this should work)
    if (groupId && groupId !== "") {
      query.groupId = groupId;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Search functionality
    if (keyword && keyword !== "") {
      query.$or = [
        { subGroupName: { $regex: keyword, $options: 'i' } }
      ];
    }

    // If brand filter is provided but no specific group is selected, 
    // we need to filter subgroups by all groups belonging to that brand
    if (brandId && brandId !== "" && (!groupId || groupId === "")) {
      // First get all groups that belong to the selected brand
      const Group = require('../models/groupModel');
      const groupsInBrand = await Group.find({ 
        brandId: brandId, 
        vendorId: vendorId, 
        isActive: true 
      }).select('_id');
      const groupIds = groupsInBrand.map(group => group._id);
      
      // Then filter subgroups by these group IDs
      if (groupIds.length > 0) {
        query.groupId = { $in: groupIds };
      } else {
        // If no groups found for this brand, return empty result
        return {
          docs: [],
          totalDocs: 0,
          limit: limit,
          page: page,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null
        };
      }
    }

    // Populate options
    let populateOptions = [
      {
        path: 'vendorId',
        select: 'vendorName vendorEmail'
      },
      {
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      }
    ];

    const result = await SubGroup.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: populateOptions
    });

    return result;
  } catch (error) {
    console.error('Error in getMySubGroups:', error);
    throw error;
  }
};

exports.getSubGroupsByGroup = async (groupId, vendorId) => {
  try {
    const subGroups = await SubGroup.find({ 
      groupId, 
      vendorId, 
      isActive: true 
    })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      })
      .sort({ subGroupName: 1 });
    
    return subGroups;
  } catch (error) {
    console.error('Error in getSubGroupsByGroup:', error);
    throw error;
  }
};

exports.getSubGroupsByName = async (subGroupName, vendorId) => {
  try {
    const query = {
      vendorId,
      subGroupName: { $regex: subGroupName, $options: 'i' },
      isActive: true
    };

    const subGroups = await SubGroup.find(query)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      })
      .sort({ subGroupName: 1 });
    
    return subGroups;
  } catch (error) {
    console.error('Error in getSubGroupsByName:', error);
    throw error;
  }
};

exports.createSubGroup = async (subGroupData) => {
  try {
    // Check if sub group with same name already exists for this vendor and group
    const existingSubGroup = await SubGroup.findOne({
      vendorId: subGroupData.vendorId,
      groupId: subGroupData.groupId,
      subGroupName: subGroupData.subGroupName
    });

    if (existingSubGroup) {
      throw new Error('Sub group with same name already exists for this group');
    }

    const subGroup = new SubGroup(subGroupData);
    const savedSubGroup = await subGroup.save();
    return await SubGroup.findById(savedSubGroup._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      });
  } catch (error) {
    console.error('Error in createSubGroup:', error);
    throw error;
  }
};

exports.updateSubGroup = async (id, vendorId, subGroupData) => {
  try {
    // Don't allow updating vendorId
    delete subGroupData.vendorId;
    
    const subGroup = await SubGroup.findOneAndUpdate(
      { _id: id, vendorId: vendorId }, 
      subGroupData, 
      { new: true, runValidators: true }
    ).populate('vendorId', 'vendorName vendorEmail')
     .populate({
       path: 'groupId',
       select: 'groupName brandId',
       populate: {
         path: 'brandId',
         select: 'brandName'
       }
     });

    if (!subGroup) {
      throw new Error('Sub group not found');
    }
    return subGroup;
  } catch (error) {
    console.error('Error in updateSubGroup:', error);
    throw error;
  }
};

exports.deleteSubGroup = async (id, vendorId) => {
  try {
    const subGroup = await SubGroup.findOneAndDelete({ _id: id, vendorId: vendorId });
    if (!subGroup) {
      throw new Error('Sub group not found');
    }
    return subGroup;
  } catch (error) {
    console.error('Error in deleteSubGroup:', error);
    throw error;
  }
};

exports.toggleSubGroupStatus = async (id, vendorId) => {
  try {
    const subGroup = await SubGroup.findOne({ _id: id, vendorId: vendorId });
    if (!subGroup) {
      throw new Error('Sub group not found');
    }

    subGroup.isActive = !subGroup.isActive;
    await subGroup.save();
    
    return await SubGroup.findById(subGroup._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      });
  } catch (error) {
    console.error('Error in toggleSubGroupStatus:', error);
    throw error;
  }
};
