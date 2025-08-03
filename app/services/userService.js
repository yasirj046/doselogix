const User = require("../models/userModel");

exports.findByEmail = async (email) => {
  try {
    // Case-insensitive email search
    return await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
  } catch (error) {
    console.error('Error in findByEmail:', error);
    throw error;
  }
};

exports.getAllUsers = async (page, limit, keyword) => {
  try {
    let query = {};
    if (keyword && keyword !== "") {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }
    return await User.paginate(query, { 
      page, 
      limit,
      select: '-password' // Exclude password from results
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
};

exports.getUserById = async (id) => {
  try {
    return await User.findById(id).select('-password');
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
};

exports.createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

exports.updateUser = async (id, userData) => {
  try {
    return await User.findByIdAndUpdate(id, userData, { 
      new: true,
      select: '-password'
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
};

exports.deleteUser = async (id) => {
  try {
    return await User.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteUser:', error);
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