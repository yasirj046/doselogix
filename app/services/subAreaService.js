const SubArea = require('../models/subAreaModel');

exports.getAllSubAreas = async (page, limit, keyword, status, vendorId, area) => {
  try {
    let query = {};
    
    // Filter by vendor if provided
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    // Filter by area if provided (exact match with areaId)
    if (area && area !== "") {
      query.areaId = area;
    }

    // Search functionality (search across subAreaName)
    if (keyword && keyword !== "") {
      query.$or = [
        { subAreaName: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await SubArea.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        },
        {
          path: 'areaId',
          select: 'area'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllSubAreas:', error);
    throw error;
  }
};

exports.getSubAreaById = async (id, vendorId) => {
  try {
    const subArea = await SubArea.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('areaId', 'area');
    if (!subArea) {
      throw new Error('Sub area not found');
    }
    return subArea;
  } catch (error) {
    console.error('Error in getSubAreaById:', error);
    throw error;
  }
};

exports.createSubArea = async (subAreaData) => {
  try {
    // Check if sub area with same name already exists for this area and vendor
    const existingSubArea = await SubArea.findOne({
      vendorId: subAreaData.vendorId,
      areaId: subAreaData.areaId,
      subAreaName: subAreaData.subAreaName
    });

    if (existingSubArea) {
      throw new Error('Sub area with same name already exists for this area');
    }

    const subArea = new SubArea(subAreaData);
    const savedSubArea = await subArea.save();
    return await SubArea.findById(savedSubArea._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('areaId', 'area');
  } catch (error) {
    console.error('Error in createSubArea:', error);
    throw error;
  }
};

exports.updateSubArea = async (id, vendorId, subAreaData) => {
  try {
    // Don't allow updating vendorId
    delete subAreaData.vendorId;

    const updatedSubArea = await SubArea.findOneAndUpdate(
      { _id: id, vendorId },
      subAreaData,
      { new: true, runValidators: true }
    ).populate('vendorId', 'vendorName vendorEmail')
     .populate('areaId', 'area');

    if (!updatedSubArea) {
      throw new Error('Sub area not found');
    }

    return updatedSubArea;
  } catch (error) {
    console.error('Error in updateSubArea:', error);
    throw error;
  }
};

exports.deleteSubArea = async (id) => {
  try {
    const deletedSubArea = await SubArea.findByIdAndDelete(id);
    if (!deletedSubArea) {
      throw new Error('Sub area not found');
    }
    return deletedSubArea;
  } catch (error) {
    console.error('Error in deleteSubArea:', error);
    throw error;
  }
};

exports.toggleSubAreaStatus = async (id, vendorId) => {
  try {
    const subArea = await SubArea.findOne({ _id: id, vendorId });
    if (!subArea) {
      throw new Error('Sub area not found');
    }

    subArea.isActive = !subArea.isActive;
    await subArea.save();

    return await SubArea.findById(subArea._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('areaId', 'area');
  } catch (error) {
    console.error('Error in toggleSubAreaStatus:', error);
    throw error;
  }
};

exports.getSubAreasByVendor = async (vendorId, filters = {}) => {
  try {
    let query = { vendorId };

    // Apply filters
    if (filters.areaId && filters.areaId !== "") {
      query.areaId = filters.areaId;
    }

    if (filters.isActive !== undefined && filters.isActive !== "") {
      query.isActive = filters.isActive === 'true';
    }

    return await SubArea.find(query)
      .sort({ subAreaName: 1 })
      .populate('areaId', 'area');
  } catch (error) {
    console.error('Error in getSubAreasByVendor:', error);
    throw error;
  }
};

exports.getSubAreasByArea = async (vendorId, areaId) => {
  try {
    return await SubArea.find({
      vendorId,
      areaId,
      isActive: true
    }).sort({ subAreaName: 1 });
  } catch (error) {
    console.error('Error in getSubAreasByArea:', error);
    throw error;
  }
};

exports.getSubAreasByName = async (vendorId, subAreaName) => {
  try {
    return await SubArea.find({
      vendorId,
      subAreaName: { $regex: subAreaName, $options: 'i' }
    }).sort({ subAreaName: 1 })
      .populate('areaId', 'area');
  } catch (error) {
    console.error('Error in getSubAreasByName:', error);
    throw error;
  }
};
