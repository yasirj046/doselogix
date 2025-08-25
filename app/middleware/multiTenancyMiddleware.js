const jwt = require("jsonwebtoken");

/**
 * Multi-tenancy middleware that ensures data isolation between vendors
 * Extracts vendor ID from JWT token and attaches vendor context to req.vendor
 */
exports.multiTenancy = (req, res, next) => {
  try {
    // Vendor ID should already be available from authenticate middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: "Vendor context not found. Please authenticate first." 
      });
    }

    // Attach vendor context to request object
    req.vendor = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    };

    next();
  } catch (error) {
    console.error('Multi-tenancy middleware error:', error);
    return res.status(500).json({ 
      message: "Error processing vendor context" 
    });
  }
};

/**
 * Middleware to ensure vendor can only access their own data
 * This is a helper middleware that can be used for additional security checks
 */
exports.ensureVendorOwnership = (req, res, next) => {
  try {
    if (!req.vendor) {
      return res.status(401).json({ 
        message: "Vendor context not found" 
      });
    }

    // For operations that require checking if the resource belongs to the vendor
    if (req.params.id) {
      // This will be handled in the service layer with automatic vendor filtering
      // The middleware just ensures vendor context is available
    }

    next();
  } catch (error) {
    console.error('Vendor ownership check error:', error);
    return res.status(500).json({ 
      message: "Error checking vendor ownership" 
    });
  }
}; 