const Area = require('../models/areaModel');

exports.getAllAreas = async (page, limit, keyword, status, vendorId, area) => {
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
    
    // Filter by area if provided (exact match)
    if (area && area !== "") {
      query.area = area;
    }

    // Search functionality (search across area)
    if (keyword && keyword !== "") {
      query.$or = [
        { area: { $regex: keyword, $options: 'i' } }
      ];
    }    return await Area.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: {
        path: 'vendorId',
        select: 'vendorName vendorEmail'
      }
    });
  } catch (error) {
    console.error('Error in getAllAreas:', error);
    throw error;
  }
};

exports.getAreaById = async (id, vendorId) => {
  try {
    const area = await Area.findOne({ _id: id, vendorId }).populate('vendorId', 'vendorName vendorEmail');
    if (!area) {
      throw new Error('Area not found');
    }
    return area;
  } catch (error) {
    console.error('Error in getAreaById:', error);
    throw error;
  }
};

exports.createArea = async (areaData) => {
  try {
    // Normalize area name for comparison (case-insensitive and trimmed)
    const normalizedAreaName = areaData.area.trim().toLowerCase();
    
    // Check if area with same name already exists for this vendor (case-insensitive)
    const existingArea = await Area.findOne({
      vendorId: areaData.vendorId,
      area: { $regex: new RegExp(`^${normalizedAreaName}$`, 'i') }
    });

    if (existingArea) {
      throw new Error('Area with same name already exists');
    }

    const area = new Area(areaData);
    const savedArea = await area.save();
    return await Area.findById(savedArea._id).populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    console.error('Error in createArea:', error);
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      throw new Error('Area with same name already exists');
    }
    throw error;
  }
};

exports.updateArea = async (id, vendorId, areaData) => {
  try {
    // Don't allow updating vendorId
    delete areaData.vendorId;
    
    // If area name is being updated, check for duplicates
    if (areaData.area) {
      const normalizedAreaName = areaData.area.trim().toLowerCase();
      
      // Check if another area with same name exists for this vendor (excluding current area)
      const existingArea = await Area.findOne({
        vendorId: vendorId,
        area: { $regex: new RegExp(`^${normalizedAreaName}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingArea) {
        throw new Error('Area with same name already exists');
      }
    }
    
    const area = await Area.findOneAndUpdate(
      { _id: id, vendorId: vendorId }, 
      areaData, 
      { new: true, runValidators: true }
    ).populate('vendorId', 'vendorName vendorEmail');
    
    if (!area) {
      throw new Error('Area not found');
    }
    
    return area;
  } catch (error) {
    console.error('Error in updateArea:', error);
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      throw new Error('Area with same name already exists');
    }
    throw error;
  }
};

exports.toggleAreaStatus = async (id, vendorId) => {
  try {
    // First find the current area to get current isActive state
    const currentArea = await Area.findOne({ _id: id, vendorId: vendorId });
    if (!currentArea) {
      return null;
    }

    // Toggle the isActive status
    const area = await Area.findOneAndUpdate(
      { _id: id, vendorId: vendorId },
      { isActive: !currentArea.isActive },
      { 
        new: true,
        populate: {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        }
      }
    );
    
    return area;
  } catch (error) {
    console.error('Error in toggleAreaStatus:', error);
    throw error;
  }
};

exports.getAreasByVendor = async (vendorId, filters = {}) => {
  try {
    const query = { vendorId };
    
    // Apply additional filters
    if (filters.area) {
      query.area = { $regex: filters.area, $options: 'i' };
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    return await Area.find(query).sort({ area: 1 });
  } catch (error) {
    console.error('Error in getAreasByVendor:', error);
    throw error;
  }
};

exports.getAreasByName = async (vendorId, areaName) => {
  try {
    return await Area.find({
      vendorId,
      area: { $regex: areaName, $options: 'i' }
    }).sort({ area: 1 });
  } catch (error) {
    console.error('Error in getAreasByName:', error);
    throw error;
  }
};
