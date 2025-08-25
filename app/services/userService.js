const User = require("../models/userModel");

exports.findByEmail = async (email) => {
  try {
    // Since vendorEmail has lowercase: true in schema, we need to search with lowercase
    // Use exact match for better performance and reliability
    const searchEmail = email.toLowerCase().trim();
    
    const result = await User.findOne({ 
      vendorEmail: searchEmail
    });
    
    return result;
  } catch (error) {
    console.error('Error in findByEmail:', error);
    throw error;
  }
};

exports.getAllVendors = async (page, limit, keyword) => {
  try {
    let query = {};
    if (keyword && keyword !== "") {
      query.$or = [
        { vendorName: { $regex: keyword, $options: 'i' } },
        { vendorEmail: { $regex: keyword, $options: 'i' } }, // Keep regex for search functionality
        { businessName: { $regex: keyword, $options: 'i' } }
      ];
    }
    return await User.paginate(query, { 
      page, 
      limit,
      select: '-vendorPassword' // Exclude password from results
    });
  } catch (error) {
    console.error('Error in getAllVendors:', error);
    throw error;
  }
};

exports.getVendorById = async (id) => {
  try {
    return await User.findById(id).select('-vendorPassword');
  } catch (error) {
    console.error('Error in getVendorById:', error);
    throw error;
  }
};

exports.createVendor = async (vendorData) => {
  try {
    const vendor = new User(vendorData);
    
    // Password will be hashed by pre-save middleware
    // No need to call hashPassword() manually
    
    await vendor.save();
    
    return vendor;
  } catch (error) {
    console.error('Error in createVendor:', error);
    throw error;
  }
};

exports.updateVendor = async (id, vendorData) => {
  try {
    return await User.findByIdAndUpdate(id, vendorData, { 
      new: true,
      select: '-vendorPassword'
    });
  } catch (error) {
    console.error('Error in updateVendor:', error);
    throw error;
  }
};

exports.deleteVendor = async (id) => {
  try {
    return await User.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteVendor:', error);
    throw error;
  }
};

exports.findById = async (id) => {
  try {
    return await User.findById(id);
  } catch (error) {
    console.error('Error in findById:', error);
    throw error;
  }
};

exports.findActiveVendors = async () => {
  try {
    return await User.find({ isActive: true }).select('-vendorPassword');
  } catch (error) {
    console.error('Error in findActiveVendors:', error);
    throw error;
  }
};

exports.findVendorsWithExpiringLicense = async (daysBefore = 30) => {
  try {
    return await User.findVendorsWithExpiringLicense(daysBefore);
  } catch (error) {
    console.error('Error in findVendorsWithExpiringLicense:', error);
    throw error;
  }
};

// Keep backward compatibility methods
exports.getAllUsers = exports.getAllVendors;
exports.getUserById = exports.getVendorById;
exports.createUser = exports.createVendor;
exports.updateUser = exports.updateVendor;
exports.deleteUser = exports.deleteVendor;