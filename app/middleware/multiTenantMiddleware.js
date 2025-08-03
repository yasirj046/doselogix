const multiTenantMiddleware = (req, res, next) => {
  // This middleware ensures all database operations are scoped to the user's company
  // It should be applied after authentication middleware
  
  if (req.user && req.user.companyId) {
    // Add companyId to query parameters for easy access in controllers
    req.companyId = req.user.companyId;
    
    // For POST/PUT requests, automatically add companyId to request body
    if (req.method === 'POST' || req.method === 'PUT') {
      if (req.body && typeof req.body === 'object') {
        req.body.companyId = req.user.companyId;
      }
    }
    
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: Company information required'
    });
  }
};

module.exports = multiTenantMiddleware;
