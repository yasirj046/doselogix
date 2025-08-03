const customerService = require("../services/customerService");

exports.createCustomer = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || "";
    
    const customers = await customerService.getAllCustomers(page, limit, keyword);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomerByCustomerId = async (req, res) => {
  try {
    const customer = await customerService.getCustomerByCustomerId(req.params.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await customerService.deleteCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomersByProvince = async (req, res) => {
  try {
    const customers = await customerService.getCustomersByProvince(req.params.province);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomersByCity = async (req, res) => {
  try {
    const customers = await customerService.getCustomersByCity(req.params.city);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomersByCategory = async (req, res) => {
  try {
    const customers = await customerService.getCustomersByCategory(req.params.category);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomersByArea = async (req, res) => {
  try {
    const customers = await customerService.getCustomersByArea(req.params.areaId);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomersBySubArea = async (req, res) => {
  try {
    const customers = await customerService.getCustomersBySubArea(req.params.subAreaId);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.restoreCustomer = async (req, res) => {
  try {
    const customer = await customerService.restoreCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer restored successfully",
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDeletedCustomers = async (req, res) => {
  try {
    const customers = await customerService.getDeletedCustomers();
    res.status(200).json({
      success: true,
      message: "Deleted customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomersWithExpiringLicenses = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const customers = await customerService.getCustomersWithExpiringLicenses(days);
    res.status(200).json({
      success: true,
      message: "Customers with expiring licenses retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const filters = {
      province: req.query.province,
      city: req.query.city,
      category: req.query.category,
      area: req.query.area,
      subArea: req.query.subArea,
      cnic: req.query.cnic,
      licenseNumber: req.query.licenseNumber ? parseInt(req.query.licenseNumber) : null
    };
    
    const customers = await customerService.searchCustomers(filters);
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
