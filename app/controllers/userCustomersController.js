const userCustomersService = require("../services/userCustomersService");
const util = require("../util/util");

exports.getAllCustomers = async (req, res) => {
  const page = parseInt(req.query.pageNumber) || 1;
  const limit = parseInt(req.query.pageSize) || 10;
  const keyword = req.query.keyword || "";
  const customerProvince = req.query.customerProvince || "";
  const customerCity = req.query.customerCity || "";
  
  // Use vendor ID from middleware instead of query parameter
  const vendorId = req.vendor.id;

  try {
    const customers = await userCustomersService.getAllCustomers(page, limit, keyword, vendorId, customerProvince, customerCity);
    res.status(200).json(util.createResponse(customers, null, "All Customers"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await userCustomersService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(200).json(util.createResponse(null, { message: "No Customer Found" }));
    }
    res.status(200).json(util.createResponse(customer, null, "Customer Found"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const {
      customerName,
      customerProvince,
      customerCity,
      customerAddress,
      customerCategory,
      customerArea,
      customerSubArea,
      customerPrimaryContact,
      customerSecondaryContact,
      customerCnic,
      customerLicenseNumber,
      customerLicenseExpiryDate
    } = req.body;

    // Use vendor ID from middleware instead of request body
    const customerData = {
      vendorId: req.vendor.id,  // Remove trim() since it's from middleware
      customerName: customerName.trim(),
      customerProvince,
      customerCity,
      customerAddress: customerAddress.trim(),
      customerCategory,
      customerArea: customerArea.trim(),
      customerSubArea: customerSubArea ? customerSubArea.trim() : undefined,
      customerPrimaryContact: customerPrimaryContact.trim(),
      customerSecondaryContact: customerSecondaryContact ? customerSecondaryContact.trim() : undefined,
      customerCnic: customerCnic.trim(),
      customerLicenseNumber: customerLicenseNumber ? customerLicenseNumber.trim() : undefined,
      customerLicenseExpiryDate: customerLicenseExpiryDate ? new Date(customerLicenseExpiryDate) : undefined
    };

    // Validation
    if (!customerName || !customerProvince || 
        !customerCity || !customerAddress || !customerCategory || 
        !customerArea || !customerPrimaryContact || !customerCnic) {
      return res.status(400).json(
        util.createResponse(null, { 
          message: "Name, province, city, address, category, area, primary contact, and CNIC are required" 
        })
      );
    }

    const customer = await userCustomersService.createCustomer(customerData);

    return res.status(201).json(
      util.createResponse(customer, null, "Customer created successfully")
    );

  } catch (error) {
    console.error('Customer creation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(
        util.createResponse(null, { message: error.message })
      );
    }
    return res.status(500).json(
      util.createResponse(null, { message: "Internal server error" })
    );
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const vendorId = req.vendor.id; // Get vendorId from middleware
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.customerCode; // Prevent customerCode from being updated since it's auto-generated

    // Handle date conversion if provided
    if (updateData.customerLicenseExpiryDate) {
      updateData.customerLicenseExpiryDate = new Date(updateData.customerLicenseExpiryDate);
    }

    const updatedCustomer = await userCustomersService.updateCustomer(customerId, updateData, vendorId);
    if (!updatedCustomer) {
      return res.status(200).json(util.createResponse(null, { message: "No Customer Found or Unauthorized" }));
    }

    res.status(200).json(util.createResponse(updatedCustomer, null, "Customer Updated"));
  } catch (error) {
    console.error('Customer update error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(
        util.createResponse(null, { message: error.message })
      );
    }
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await userCustomersService.deleteCustomer(req.params.id);
    if (!deletedCustomer) {
      return res.status(200).json(util.createResponse(null, { message: "No Customer Found" }));
    }
    res.status(200).json(util.createResponse(deletedCustomer, null, "Customer Deleted"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getCustomersByVendor = async (req, res) => {
  try {
    // Use vendor ID from middleware instead of params
    const vendorId = req.vendor.id;
    const filters = {
      customerCategory: req.query.customerCategory,
      customerProvince: req.query.customerProvince,
      customerCity: req.query.customerCity
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const customers = await userCustomersService.getCustomersByVendor(vendorId, filters);
    res.status(200).json(util.createResponse(customers, null, "Vendor Customers"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getMyCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const customerProvince = req.query.customerProvince || "";
    const customerCity = req.query.customerCity || "";
    
    // Use vendor ID from middleware
    const vendorId = req.vendor.id;

    const customers = await userCustomersService.getAllCustomers(page, limit, keyword, vendorId, customerProvince, customerCity);
    res.status(200).json(util.createResponse(customers, null, "My Customers"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getCustomersWithExpiringLicense = async (req, res) => {
  try {
    // Use vendor ID from middleware
    const vendorId = req.vendor.id;
    const daysBefore = parseInt(req.query.daysBefore) || 30;

    const customers = await userCustomersService.getCustomersWithExpiringLicense(vendorId, daysBefore);
    res.status(200).json(util.createResponse(customers, null, "Customers with Expiring License"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getCustomersByCategory = async (req, res) => {
  try {
    const { vendorId, customerCategory } = req.params;

    if (!customerCategory) {
      return res.status(400).json(
        util.createResponse(null, { message: "Customer category is required" })
      );
    }

    const customers = await userCustomersService.getCustomersByCategory(vendorId, customerCategory);
    res.status(200).json(util.createResponse(customers, null, `${customerCategory} Customers`));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getCustomersByLocation = async (req, res) => {
  try {
    const { vendorId, customerProvince } = req.params;
    const customerCity = req.query.customerCity;

    if (!customerProvince) {
      return res.status(400).json(
        util.createResponse(null, { message: "Customer province is required" })
      );
    }

    const customers = await userCustomersService.getCustomersByLocation(vendorId, customerProvince, customerCity);
    const locationText = customerCity ? `${customerCity}, ${customerProvince}` : customerProvince;
    res.status(200).json(util.createResponse(customers, null, `Customers in ${locationText}`));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const customer = await userCustomersService.toggleCustomerStatus(id, vendorId);
    if (!customer) {
      return res.status(200).json(util.createResponse(null, { message: "No Customer Found or Unauthorized" }));
    }
    
    const statusText = customer.isActive ? "activated" : "deactivated";
    res.status(200).json(util.createResponse(customer, null, `Customer ${statusText}`));
  } catch (error) {
    console.error('Customer status toggle error:', error);
    res.status(200).json(util.createResponse(null, error));
  }
}; 