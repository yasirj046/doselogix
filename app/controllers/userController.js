const userService = require("../services/userService");
const util = require("../util/util");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json(
        util.createResponse(null, { message: "Email and password are required" })
      );
    }

    // Find user by email (case-insensitive)
    const user = await userService.findByEmail(email.trim().toLowerCase());
    
    if (!user) {
      return res.status(200).json(
        util.createResponse(null, { message: "Invalid email or password" })
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(200).json(
        util.createResponse(null, { message: "Invalid email or password" })
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(200).json(
      util.createResponse(
        { token, user: userData }, 
        null, 
        "Login successful"
      )
    );

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(
      util.createResponse(null, { message: "Internal server error" })
    );
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json(
        util.createResponse(null, { message: "Name, email and password are required" })
      );
    }

    if (password.length < 6) {
      return res.status(400).json(
        util.createResponse(null, { message: "Password must be at least 6 characters long" })
      );
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json(
        util.createResponse(null, { message: "User with this email already exists" })
      );
    }

    // Create user - password will be hashed by pre-save middleware
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password // Don't hash here, let the model's pre-save middleware do it
    };

    const user = await userService.createUser(userData);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        name: user.name
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data without password
    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(201).json(
      util.createResponse(
        { token, user: responseUser }, 
        null, 
        "User registered successfully"
      )
    );

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json(
      util.createResponse(null, { message: "Internal server error" })
    );
  }
};

exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.pageNumber) || 1;
  const limit = parseInt(req.query.pageSize) || 10;
  const keyword = req.query.keyword || "";

  try {
    const users = await userService.getAllUsers(page, limit, keyword);
    res.status(200).json(util.createResponse(users, null, "All Users"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(200).json(util.createResponse(null, { message: "No User Found" }));
    }
    res.status(200).json(util.createResponse(user, null, "User Found"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(200).json(util.createResponse(null, { message: "No User Found" }));
    }
    res.status(200).json(util.createResponse(updatedUser, null, "User Updated"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json(
        util.createResponse(null, { message: "User not found" })
      );
    }

    // Return user data without sensitive information
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      licenseInfo: user.licenseInfo,
      notificationPreferences: user.notificationPreferences,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json(util.createResponse(userProfile, null, "Profile retrieved successfully"));
  } catch (error) {
    res.status(500).json(util.createResponse(null, error));
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData._id;
    delete updateData.__v;

    // Validate email if being updated
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
      // Check if email is already taken by another user
      const existingUser = await userService.findByEmail(updateData.email);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json(
          util.createResponse(null, { message: "Email is already in use by another account" })
        );
      }
    }

    const updatedUser = await userService.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json(
        util.createResponse(null, { message: "User not found" })
      );
    }

    // Return updated user data without sensitive information
    const userProfile = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      licenseInfo: updatedUser.licenseInfo,
      notificationPreferences: updatedUser.notificationPreferences,
      profile: updatedUser.profile,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.status(200).json(util.createResponse(userProfile, null, "Profile updated successfully"));
  } catch (error) {
    res.status(500).json(util.createResponse(null, error));
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        util.createResponse(null, { message: "Current password and new password are required" })
      );
    }

    // Find user with password field
    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json(
        util.createResponse(null, { message: "User not found" })
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        util.createResponse(null, { message: "Current password is incorrect" })
      );
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json(
        util.createResponse(null, { message: "New password must be at least 6 characters long" })
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await userService.updateUser(userId, { password: hashedNewPassword });

    res.status(200).json(util.createResponse(null, null, "Password changed successfully"));
  } catch (error) {
    res.status(500).json(util.createResponse(null, error));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);
    if (!deletedUser) {
      return res.status(200).json(util.createResponse(null, { message: "No User Found" }));
    }
    res.status(200).json(util.createResponse(deletedUser, null, "User Deleted"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};