const Subgroup = require("../models/subgroupModel");

exports.createSubgroup = async (subgroupData) => {
  try {
    const subgroup = new Subgroup(subgroupData);
    return await subgroup.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllSubgroups = async (page = 1, limit = 50, keyword = "") => {
  let query = { isActive: true };
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Subgroup.paginate(query, { 
    page, 
    limit, 
    sort: { name: 1 },
    populate: { path: 'group', select: 'name' }
  });
};

exports.getSubgroupsByGroup = async (groupId) => {
  return await Subgroup.find({ group: groupId, isActive: true }).sort({ name: 1 });
};

exports.getSubgroupById = async (id) => {
  return await Subgroup.findOne({ _id: id, isActive: true }).populate('group');
};

exports.updateSubgroup = async (id, subgroupData) => {
  return await Subgroup.findOneAndUpdate(
    { _id: id, isActive: true },
    subgroupData, 
    { new: true, runValidators: true }
  ).populate('group');
};

exports.deleteSubgroup = async (id) => {
  // Check if subgroup is used by active products
  const Product = require("../models/productModel");
  const productCount = await Product.countDocuments({ subgroup: id, isActive: true });
  
  if (productCount > 0) {
    throw new Error('Cannot delete subgroup that is used by active products');
  }
  
  // Soft delete - mark as inactive
  return await Subgroup.findByIdAndUpdate(
    id, 
    { isActive: false }, 
    { new: true }
  );
};

exports.restoreSubgroup = async (id) => {
  // Restore soft-deleted subgroup
  return await Subgroup.findByIdAndUpdate(
    id, 
    { isActive: true }, 
    { new: true }
  );
};

exports.getDeletedSubgroups = async () => {
  // Get all soft-deleted subgroups
  return await Subgroup.find({ isActive: false })
    .populate('group', 'name')
    .sort({ name: 1 });
};

exports.searchSubgroups = async (keyword, groupId = null) => {
  let query = { isActive: true };
  
  if (groupId) {
    query.group = groupId;
  }
  
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  
  return await Subgroup.find(query).populate('group').sort({ name: 1 });
};
