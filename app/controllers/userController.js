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

    // Find vendor by email (case-insensitive)
    const vendor = await userService.findByEmail(email.trim().toLowerCase());
    
    if (!vendor) {
      return res.status(200).json(
        util.createResponse(null, { message: "Invalid email or password" })
      );
    }

    // Check password
    const isPasswordValid = await vendor.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(200).json(
        util.createResponse(null, { message: "Invalid email or password" })
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: vendor._id, 
        email: vendor.vendorEmail,
        name: vendor.vendorName,
        role: vendor.vendorRole || 'vendor'
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return vendor data without password
    const vendorData = {
      id: vendor._id,
      vendorName: vendor.vendorName,
      vendorEmail: vendor.vendorEmail,
      vendorRole: vendor.vendorRole || 'vendor',
      vendorPhone: vendor.vendorPhone,
      businessName: vendor.businessName,
      isActive: vendor.isActive,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };

    return res.status(200).json(
      util.createResponse(
        { token, vendor: vendorData }, 
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
    const { vendorName, vendorEmail, vendorPassword, vendorPhone, businessName } = req.body;
    
    // Validation
    if (!vendorName || !vendorEmail || !vendorPassword) {
      return res.status(400).json(
        util.createResponse(null, { message: "Vendor name, email and password are required" })
      );
    }

    if (vendorPassword.length < 6) {
      return res.status(400).json(
        util.createResponse(null, { message: "Password must be at least 6 characters long" })
      );
    }

    // Check if vendor already exists
    const existingVendor = await userService.findByEmail(vendorEmail.trim().toLowerCase());
    if (existingVendor) {
      return res.status(400).json(
        util.createResponse(null, { message: "Vendor with this email already exists" })
      );
    }

    // Create vendor - password will be hashed by pre-save middleware
    const vendorData = {
      vendorName: vendorName.trim(),
      vendorEmail: vendorEmail.trim().toLowerCase(),
      vendorPassword: vendorPassword, // Don't hash here, let the model's pre-save middleware do it
      vendorPhone: vendorPhone ? vendorPhone.trim() : undefined,
      businessName: businessName ? businessName.trim() : undefined
    };

    const vendor = await userService.createVendor(vendorData);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: vendor._id, 
        email: vendor.vendorEmail,
        name: vendor.vendorName,
        role: vendor.vendorRole || 'vendor'
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return vendor data without password
    const responseVendor = {
      id: vendor._id,
      vendorName: vendor.vendorName,
      vendorEmail: vendor.vendorEmail,
      vendorRole: vendor.vendorRole,
      vendorPhone: vendor.vendorPhone,
      businessName: vendor.businessName,
      isActive: vendor.isActive,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };

    return res.status(201).json(
      util.createResponse(
        { token, vendor: responseVendor }, 
        null, 
        "Vendor registered successfully"
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
    const vendors = await userService.getAllVendors(page, limit, keyword);
    res.status(200).json(util.createResponse(vendors, null, "All Vendors"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getUserById = async (req, res) => {
  try {
    const vendor = await userService.getVendorById(req.params.id);
    if (!vendor) {
      return res.status(200).json(util.createResponse(null, { message: "No Vendor Found" }));
    }
    res.status(200).json(util.createResponse(vendor, null, "Vendor Found"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedVendor = await userService.updateVendor(req.params.id, req.body);
    if (!updatedVendor) {
      return res.status(200).json(util.createResponse(null, { message: "No Vendor Found" }));
    }
    res.status(200).json(util.createResponse(updatedVendor, null, "Vendor Updated"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

// Get current vendor profile
exports.getProfile = async (req, res) => {
  try {
    const vendor = await userService.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json(
        util.createResponse(null, { message: "Vendor not found" })
      );
    }

    // Return vendor data without sensitive information
    const vendorProfile = {
      id: vendor._id,
      vendorName: vendor.vendorName,
      vendorEmail: vendor.vendorEmail,
      vendorPhone: vendor.vendorPhone,
      vendorAddress: vendor.vendorAddress,
      vendorRole: vendor.vendorRole,
      isActive: vendor.isActive,
      businessName: vendor.businessName,
      businessLicenseNumber: vendor.businessLicenseNumber,
      businessLicenseExpiryDate: vendor.businessLicenseExpiryDate,
      businessLicenseIssueDate: vendor.businessLicenseIssueDate,
      businessLicenseAuthority: vendor.businessLicenseAuthority,
      businessLicenseStatus: vendor.businessLicenseStatus,
      lastLoginDate: vendor.lastLoginDate,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };

    res.status(200).json(util.createResponse(vendorProfile, null, "Profile retrieved successfully"));
  } catch (error) {
    res.status(500).json(util.createResponse(null, error));
  }
};

// Get profile settings and validate session - optimized for frontend session validation
exports.getProfileSettings = async (req, res) => {
  try {
    const vendor = await userService.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json(
        util.createResponse(null, { message: "User not found" })
      );
    }

    // Check if user is active
    if (!vendor.isActive) {
      return res.status(403).json(
        util.createResponse(null, { message: "Account is deactivated" })
      );
    }

    // Return essential profile settings for frontend
    const profileSettings = {
      id: vendor._id,
      vendorName: vendor.vendorName,
      vendorEmail: vendor.vendorEmail,
      vendorPhone: vendor.vendorPhone,
      vendorRole: vendor.vendorRole || 'vendor',
      isActive: vendor.isActive,
      businessName: vendor.businessName,
      lastLoginDate: vendor.lastLoginDate,
      sessionValid: true,
      tokenExpiry: req.user.exp || null
    };

    res.status(200).json(
      util.createResponse(profileSettings, null, "Session validated and profile settings retrieved")
    );
  } catch (error) {
    console.error('GetProfileSettings error:', error);
    res.status(500).json(
      util.createResponse(null, { message: "Internal server error" })
    );
  }
};

// Update current vendor profile
exports.updateProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.vendorPassword;
    delete updateData.vendorRole;
    delete updateData._id;
    delete updateData.__v;

    // Validate email if being updated
    if (updateData.vendorEmail) {
      updateData.vendorEmail = updateData.vendorEmail.trim().toLowerCase();
      // Check if email is already taken by another vendor
      const existingVendor = await userService.findByEmail(updateData.vendorEmail);
      if (existingVendor && existingVendor._id.toString() !== vendorId) {
        return res.status(400).json(
          util.createResponse(null, { message: "Email is already in use by another vendor" })
        );
      }
    }

    const updatedVendor = await userService.updateVendor(vendorId, updateData);
    if (!updatedVendor) {
      return res.status(404).json(
        util.createResponse(null, { message: "Vendor not found" })
      );
    }

    // Return updated vendor data without sensitive information
    const vendorProfile = {
      id: updatedVendor._id,
      vendorName: updatedVendor.vendorName,
      vendorEmail: updatedVendor.vendorEmail,
      vendorPhone: updatedVendor.vendorPhone,
      vendorAddress: updatedVendor.vendorAddress,
      vendorRole: updatedVendor.vendorRole,
      isActive: updatedVendor.isActive,
      businessName: updatedVendor.businessName,
      businessLicenseNumber: updatedVendor.businessLicenseNumber,
      businessLicenseExpiryDate: updatedVendor.businessLicenseExpiryDate,
      businessLicenseIssueDate: updatedVendor.businessLicenseIssueDate,
      businessLicenseAuthority: updatedVendor.businessLicenseAuthority,
      lastLoginDate: updatedVendor.lastLoginDate,
      createdAt: updatedVendor.createdAt,
      updatedAt: updatedVendor.updatedAt
    };

    res.status(200).json(util.createResponse(vendorProfile, null, "Profile updated successfully"));
  } catch (error) {
    res.status(500).json(util.createResponse(null, error));
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const vendorId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        util.createResponse(null, { message: "Current password and new password are required" })
      );
    }

    // Find vendor with password field
    const vendor = await userService.findById(vendorId);
    if (!vendor) {
      return res.status(404).json(
        util.createResponse(null, { message: "Vendor not found" })
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, vendor.vendorPassword);
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
    await userService.updateVendor(vendorId, { vendorPassword: hashedNewPassword });

    res.status(200).json(util.createResponse(null, null, "Password changed successfully"));
  } catch (error) {
    res.status(500).json(util.createResponse(null, error));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedVendor = await userService.deleteVendor(req.params.id);
    if (!deletedVendor) {
      return res.status(200).json(util.createResponse(null, { message: "No Vendor Found" }));
    }
    res.status(200).json(util.createResponse(deletedVendor, null, "Vendor Deleted"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};