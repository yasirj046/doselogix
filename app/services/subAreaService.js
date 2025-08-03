const SubArea = require("../models/subAreaModel");

exports.createSubArea = async (subAreaData) => {
  try {
    const subArea = new SubArea(subAreaData);
    return await subArea.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllSubAreas = async (page = 1, limit = 50, keyword = "") => {
  let query = {};
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await SubArea.paginate(query, { 
    page, 
    limit, 
    sort: { name: 1 },
    populate: { path: 'area', select: 'name city' }
  });
};

exports.getSubAreasByArea = async (areaId) => {
  return await SubArea.find({ area: areaId }).sort({ name: 1 });
};

exports.getSubAreaById = async (id) => {
  return await SubArea.findById(id).populate('area');
};

exports.updateSubArea = async (id, subAreaData) => {
  return await SubArea.findByIdAndUpdate(
    id,
    subAreaData, 
    { new: true, runValidators: true }
  ).populate('area');
};

exports.deleteSubArea = async (id) => {
  // Check if subarea is used by customers
  const Customer = require("../models/customerModel");
  const customerCount = await Customer.countDocuments({ subArea: id, isActive: true });
  
  if (customerCount > 0) {
    throw new Error('Cannot delete sub-area that is used by active customers');
  }
  
  return await SubArea.findByIdAndDelete(id);
};

exports.searchSubAreas = async (keyword, areaId = null) => {
  let query = {};
  
  if (areaId) {
    query.area = areaId;
  }
  
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  
  return await SubArea.find(query).populate('area').sort({ name: 1 });
};
