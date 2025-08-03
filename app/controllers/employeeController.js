const employeeService = require("../services/employeeService");

exports.createEmployee = async (req, res) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || "";
    
    const employees = await employeeService.getAllEmployees(page, limit, keyword);
    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEmployeeByEmployeeId = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeByEmployeeId(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEmployeesByProvince = async (req, res) => {
  try {
    const employees = await employeeService.getEmployeesByProvince(req.params.province);
    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEmployeesByCity = async (req, res) => {
  try {
    const employees = await employeeService.getEmployeesByCity(req.params.city);
    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEmployeesByDesignation = async (req, res) => {
  try {
    const employees = await employeeService.getEmployeesByDesignation(req.params.designation);
    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.restoreEmployee = async (req, res) => {
  try {
    const employee = await employeeService.restoreEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Employee restored successfully",
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDeletedEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getDeletedEmployees();
    res.status(200).json({
      success: true,
      message: "Deleted employees retrieved successfully",
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchEmployees = async (req, res) => {
  try {
    const filters = {
      province: req.query.province,
      city: req.query.city,
      designation: req.query.designation,
      minSalary: req.query.minSalary ? parseInt(req.query.minSalary) : null,
      maxSalary: req.query.maxSalary ? parseInt(req.query.maxSalary) : null
    };
    
    const employees = await employeeService.searchEmployees(filters);
    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
