const Group = require("../models/groupModel");

exports.createGroup = async (groupData) => {
  try {
    const group = new Group(groupData);
    return await group.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllGroups = async (page = 1, limit = 50, keyword = "") => {
  let query = { isActive: true };
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Group.paginate(query, { 
    page, 
    limit, 
    sort: { name: 1 }
  });
};

exports.getGroupById = async (id) => {
  return await Group.findOne({ _id: id, isActive: true }).populate('subgroups');
};

exports.updateGroup = async (id, groupData) => {
  return await Group.findOneAndUpdate(
    { _id: id, isActive: true },
    groupData, 
    { new: true, runValidators: true }
  );
};

exports.deleteGroup = async (id) => {
  // Check if group has active subgroups
  const Subgroup = require("../models/subgroupModel");
  const subgroupCount = await Subgroup.countDocuments({ group: id, isActive: true });
  
  if (subgroupCount > 0) {
    throw new Error('Cannot delete group that has active subgroups');
  }
  
  // Check if group is used by active products
  const Product = require("../models/productModel");
  const productCount = await Product.countDocuments({ group: id, isActive: true });
  
  if (productCount > 0) {
    throw new Error('Cannot delete group that is used by active products');
  }
  
  // Soft delete - mark as inactive
  return await Group.findByIdAndUpdate(
    id, 
    { isActive: false }, 
    { new: true }
  );
};

exports.restoreGroup = async (id) => {
  // Restore soft-deleted group
  return await Group.findByIdAndUpdate(
    id, 
    { isActive: true }, 
    { new: true }
  );
};

exports.getDeletedGroups = async () => {
  // Get all soft-deleted groups
  return await Group.find({ isActive: false }).sort({ name: 1 });
};

exports.searchGroups = async (keyword) => {
  let query = { isActive: true };
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Group.find(query).sort({ name: 1 });
};
