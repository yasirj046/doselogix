const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');

// Super admin authentication middleware
const superAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token required'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('🔍 Decoded token:', decoded); // Debug log
    
    if (!decoded.isSuperAdmin || decoded.role !== 'super_admin') {
      console.log('❌ Super admin check failed:', { isSuperAdmin: decoded.isSuperAdmin, role: decoded.role }); // Debug log
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token verification error:', error.message); // Debug log
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

// Public route for super admin login
router.post('/login', superAdminController.login);

// Protected routes (require super admin authentication)
router.use(superAdminAuth);

// Company management routes
router.get('/companies', superAdminController.getAllCompanies);
router.get('/companies/:companyId', superAdminController.getCompanyDetails);
router.put('/companies/:companyId/status', superAdminController.updateCompanyStatus);
router.delete('/companies/:companyId', superAdminController.deleteCompany);

// Dashboard routes
router.get('/dashboard/stats', superAdminController.getDashboardStats);

module.exports = router;
