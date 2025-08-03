const Area = require("../models/areaModel");

exports.createArea = async (areaData) => {
  try {
    const area = new Area(areaData);
    return await area.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllAreas = async (page = 1, limit = 50, keyword = "") => {
  let query = {};
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Area.paginate(query, { 
    page, 
    limit, 
    sort: { name: 1 }
  });
};

exports.getAreasByCity = async (city) => {
  return await Area.find({ city }).sort({ name: 1 });
};

exports.getAreaById = async (id) => {
  return await Area.findById(id).populate('subAreas');
};

exports.updateArea = async (id, areaData) => {
  return await Area.findByIdAndUpdate(
    id,
    areaData, 
    { new: true, runValidators: true }
  );
};

exports.deleteArea = async (id) => {
  // Check if area has subareas
  const SubArea = require("../models/subAreaModel");
  const subAreaCount = await SubArea.countDocuments({ area: id });
  
  if (subAreaCount > 0) {
    throw new Error('Cannot delete area that has sub-areas');
  }
  
  // Check if area is used by customers
  const Customer = require("../models/customerModel");
  const customerCount = await Customer.countDocuments({ area: id, isActive: true });
  
  if (customerCount > 0) {
    throw new Error('Cannot delete area that is used by active customers');
  }
  
  return await Area.findByIdAndDelete(id);
};

exports.searchAreas = async (keyword, city = null) => {
  let query = {};
  
  if (city) {
    query.city = city;
  }
  
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  
  return await Area.find(query).sort({ name: 1 });
};
