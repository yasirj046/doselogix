const Company = require('../models/companyModel');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../util/sendEmail'); // Assuming this utility exists

const companyController = {
  // Register a new company with admin user
  register: async (req, res) => {
    try {
      const {
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCity,
        companyProvince,
        companyType,
        licenseNumber,
        taxId,
        adminName,
        adminEmail,
        adminPhone,
        password
      } = req.body;

      // Validate required fields
      if (!companyName || !companyEmail || !adminName || !adminEmail || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Required fields missing'
        });
      }

      // Check if company email already exists
      const existingCompany = await Company.findOne({ companyEmail });
      if (existingCompany) {
        return res.status(400).json({
          status: 'error',
          message: 'Company email already registered'
        });
      }

      // Check if admin email already exists
      const existingUser = await User.findOne({ email: adminEmail });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Admin email already registered'
        });
      }

      // Generate OTP for email verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create company
      const company = new Company({
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCity,
        companyProvince,
        companyType,
        licenseNumber,
        taxId,
        verificationOtp: otp,
        otpExpiry,
        status: 'pending_verification'
      });

      await company.save();

      // Create admin user
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        role: 'admin',
        companyId: company._id,
        isActive: false // Will be activated after company verification
      });

      await adminUser.save();

      // Send verification email
      try {
        const emailSubject = 'Verify Your Company Registration';
        const emailText = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
        const emailHtml = `
          <h2>Welcome to DMS Platform</h2>
          <p>Thank you for registering your company: <strong>${companyName}</strong></p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #2196F3;">${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this registration, please ignore this email.</p>
        `;

        const emailResult = await sendEmail(companyEmail, emailSubject, emailText, emailHtml);
        console.log('Email sending result:', emailResult);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // Continue with registration even if email fails in development
        if (process.env.NODE_ENV !== 'development') {
          throw emailError;
        }
      }

      res.status(201).json({
        status: 'success',
        message: 'Company registration initiated. Please check your email for verification code.',
        data: {
          companyId: company._id,
          companyName: company.companyName,
          verificationRequired: true
        }
      });

    } catch (error) {
      console.error('Company registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error during registration'
      });
    }
  },

  // Verify company registration with OTP
  verifyRegistration: async (req, res) => {
    try {
      const { companyEmail, otp } = req.body;

      if (!companyEmail || !otp) {
        return res.status(400).json({
          status: 'error',
          message: 'Company email and OTP are required'
        });
      }

      // Find company
      const company = await Company.findOne({ companyEmail });
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Check if already verified
      if (company.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Company already verified'
        });
      }

      // Verify OTP
      if (company.verificationOtp !== otp || new Date() > company.otpExpiry) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification code'
        });
      }

      // Update company status
      company.isVerified = true;
      company.status = 'approved';
      company.verificationOtp = undefined;
      company.otpExpiry = undefined;
      company.verifiedAt = new Date();
      await company.save();

      // Activate admin user
      await User.findOneAndUpdate(
        { companyId: company._id, role: 'admin' },
        { isActive: true }
      );

      res.status(200).json({
        status: 'success',
        message: 'Company verified successfully',
        data: {
          companyId: company._id,
          companyName: company.companyName,
          status: company.status
        }
      });

    } catch (error) {
      console.error('Company verification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error during verification'
      });
    }
  },

  // Resend verification OTP
  resendOtp: async (req, res) => {
    try {
      const { companyEmail } = req.body;

      if (!companyEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Company email is required'
        });
      }

      const company = await Company.findOne({ companyEmail });
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      if (company.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Company already verified'
        });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      company.verificationOtp = otp;
      company.otpExpiry = otpExpiry;
      await company.save();

      // Send email
      try {
        const emailSubject = 'New Verification Code - DMS Platform';
        const emailText = `Your new verification code is: ${otp}. This code will expire in 10 minutes.`;
        const emailHtml = `
          <h2>New Verification Code</h2>
          <p>Your new verification code is: <strong style="font-size: 24px; color: #2196F3;">${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `;

        const emailResult = await sendEmail(companyEmail, emailSubject, emailText, emailHtml);
        console.log('Resend email result:', emailResult);
      } catch (emailError) {
        console.error('Resend email failed:', emailError.message);
        // Continue even if email fails in development
        if (process.env.NODE_ENV !== 'development') {
          throw emailError;
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'New verification code sent to your email'
      });

    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Get company profile (for admin users)
  getProfile: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      const company = await Company.findById(companyId)
        .select('-verificationOtp -otpExpiry')
        .populate('subscription.plan');

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: company
      });

    } catch (error) {
      console.error('Get company profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Update company profile
  updateProfile: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allowedFields = [
        'companyName', 'companyPhone', 'companyAddress', 
        'companyCity', 'companyProvince', 'companyType',
        'licenseNumber', 'taxId', 'website', 'description'
      ];

      const updateData = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const company = await Company.findByIdAndUpdate(
        companyId,
        updateData,
        { new: true, runValidators: true }
      ).select('-verificationOtp -otpExpiry');

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Company profile updated successfully',
        data: company
      });

    } catch (error) {
      console.error('Update company profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Get company statistics (for dashboard)
  getStatistics: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      // Get basic company info
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Get user count
      const userCount = await User.countDocuments({ companyId, isActive: true });

      // Additional statistics can be added here
      // const productCount = await Product.countDocuments({ companyId });
      // const orderCount = await Order.countDocuments({ companyId });

      const statistics = {
        companyInfo: {
          name: company.companyName,
          status: company.status,
          verifiedAt: company.verifiedAt,
          memberSince: company.createdAt
        },
        users: {
          total: userCount,
          active: userCount // Simplified for now
        },
        subscription: company.subscription
        // Add more statistics as needed
      };

      res.status(200).json({
        status: 'success',
        data: statistics
      });

    } catch (error) {
      console.error('Get company statistics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
};

module.exports = companyController;
