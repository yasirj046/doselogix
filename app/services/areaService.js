const Area = require('../models/areaModel');

exports.getAllAreas = async (page, limit, keyword, status, vendorId, area, subArea) => {
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
    
    // Filter by subArea if provided (exact match)
    if (subArea && subArea !== "") {
      query.subArea = subArea;
    }
    
    // Search functionality (search across area and subArea)
    if (keyword && keyword !== "") {
      query.$or = [
        { area: { $regex: keyword, $options: 'i' } },
        { subArea: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await Area.paginate(query, { 
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
    // Check if area with same name and sub area already exists for this vendor
    const existingArea = await Area.findOne({
      vendorId: areaData.vendorId,
      area: areaData.area,
      subArea: areaData.subArea
    });

    if (existingArea) {
      throw new Error('Area with same name and sub area already exists');
    }

    const area = new Area(areaData);
    const savedArea = await area.save();
    return await Area.findById(savedArea._id).populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    console.error('Error in createArea:', error);
    throw error;
  }
};

exports.updateArea = async (id, vendorId, areaData) => {
  try {
    // Don't allow updating vendorId
    delete areaData.vendorId;
    
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

    return await Area.find(query).sort({ area: 1, subArea: 1 });
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
    }).sort({ subArea: 1 });
  } catch (error) {
    console.error('Error in getAreasByName:', error);
    throw error;
  }
};
