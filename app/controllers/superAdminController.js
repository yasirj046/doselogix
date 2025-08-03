const Company = require('../models/companyModel');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const superAdminController = {
  // Super Admin login with hardcoded credentials
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check hardcoded super admin credentials
      const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@dms.com';
      const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
      
      if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid super admin credentials'
        });
      }

      // Generate token for super admin
      const token = jwt.sign(
        { 
          id: 'super_admin',
          email: SUPER_ADMIN_EMAIL,
          role: 'super_admin',
          isSuperAdmin: true
        }, 
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        status: 'success',
        message: 'Super admin login successful',
        data: {
          token,
          user: {
            id: 'super_admin',
            email: SUPER_ADMIN_EMAIL,
            role: 'super_admin',
            name: 'Super Administrator'
          }
        }
      });

    } catch (error) {
      console.error('Super admin login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Get all companies with their status
  getAllCompanies: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      
      let query = {};
      
      // Filter by status if provided
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // Search by company name or email
      if (search) {
        query.$or = [
          { companyName: { $regex: search, $options: 'i' } },
          { companyEmail: { $regex: search, $options: 'i' } }
        ];
      }

      const companies = await Company.find(query)
        .select('-verificationOtp -otpExpiry')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Company.countDocuments(query);
      
      // Get user count for each company
      const companiesWithUserCount = await Promise.all(
        companies.map(async (company) => {
          const userCount = await User.countDocuments({ 
            companyId: company._id,
            isActive: true 
          });
          return {
            ...company.toObject(),
            userCount
          };
        })
      );

      res.status(200).json({
        status: 'success',
        data: {
          companies: companiesWithUserCount,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalCompanies: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get all companies error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Get company details with users
  getCompanyDetails: async (req, res) => {
    try {
      const { companyId } = req.params;

      const company = await Company.findById(companyId)
        .select('-verificationOtp -otpExpiry');

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Get all users for this company
      const users = await User.find({ companyId })
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({
        status: 'success',
        data: {
          company,
          users,
          totalUsers: users.length,
          activeUsers: users.filter(user => user.isActive).length
        }
      });

    } catch (error) {
      console.error('Get company details error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Approve or reject company
  updateCompanyStatus: async (req, res) => {
    try {
      const { companyId } = req.params;
      const { status, rejectionReason } = req.body;

      if (!['approved', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Must be approved, rejected, or suspended'
        });
      }

      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Update company status
      company.status = status;
      if (status === 'rejected' && rejectionReason) {
        company.rejectionReason = rejectionReason;
      }
      company.reviewedAt = new Date();
      await company.save();

      // Update user status based on company status
      const userUpdateData = { 
        isActive: status === 'approved' 
      };
      
      await User.updateMany(
        { companyId },
        userUpdateData
      );

      res.status(200).json({
        status: 'success',
        message: `Company ${status} successfully`,
        data: {
          companyId: company._id,
          companyName: company.companyName,
          status: company.status
        }
      });

    } catch (error) {
      console.error('Update company status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const [
        totalCompanies,
        pendingCompanies,
        approvedCompanies,
        rejectedCompanies,
        totalUsers,
        activeUsers
      ] = await Promise.all([
        Company.countDocuments(),
        Company.countDocuments({ status: 'pending_verification' }),
        Company.countDocuments({ status: 'approved' }),
        Company.countDocuments({ status: 'rejected' }),
        User.countDocuments(),
        User.countDocuments({ isActive: true })
      ]);

      // Get recent companies (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentCompanies = await Company.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.status(200).json({
        status: 'success',
        data: {
          companies: {
            total: totalCompanies,
            pending: pendingCompanies,
            approved: approvedCompanies,
            rejected: rejectedCompanies,
            recentlyRegistered: recentCompanies
          },
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers
          }
        }
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  },

  // Delete company and all its data
  deleteCompany: async (req, res) => {
    try {
      const { companyId } = req.params;

      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Delete all users associated with the company
      await User.deleteMany({ companyId });

      // Delete the company
      await Company.findByIdAndDelete(companyId);

      res.status(200).json({
        status: 'success',
        message: 'Company and all associated data deleted successfully',
        data: {
          deletedCompany: company.companyName
        }
      });

    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
};

module.exports = superAdminController;
