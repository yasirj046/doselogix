const employeeService = require("../services/employeeService");
const util = require("../util/util");

exports.getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const designation = req.query.designation || "";
    const status = req.query.status || "";
    const vendorId = req.vendor.id;

    const result = await employeeService.getAllEmployees(page, limit, keyword, designation, status, vendorId);
    
    res.status(200).json(
      util.createResponse(result, null, "Employees retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const employee = await employeeService.getEmployeeById(id, vendorId);
    
    if (!employee) {
      return res.status(200).json(util.createResponse(null, { message: "No Employee Found" }));
    }

    res.status(200).json(
      util.createResponse(employee, null, "Employee retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const employeeData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['employeeName', 'city', 'address', 'primaryContact', 'cnic', 'salary', 'designation'];
    const missingFields = requiredFields.filter(field => !employeeData[field]);
    
    if (missingFields.length > 0) {
      return res.status(200).json(
        util.createResponse(null, { 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        })
      );
    }

    // Check if CNIC already exists for this vendor
    const cnicExists = await employeeService.checkCnicExists(employeeData.cnic, vendorId);
    if (cnicExists) {
      return res.status(200).json(
        util.createResponse(null, { 
          message: "An employee with this CNIC already exists" 
        })
      );
    }

    const employee = await employeeService.createEmployee(employeeData);
    
    res.status(200).json(
      util.createResponse(employee, null, "Employee created successfully")
    );
  } catch (error) {
    console.error('Error in createEmployee:', error);
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;
    const employeeData = req.body;

    // If CNIC is being updated, check if it already exists
    if (employeeData.cnic) {
      const cnicExists = await employeeService.checkCnicExists(employeeData.cnic, vendorId, id);
      if (cnicExists) {
        return res.status(200).json(
          util.createResponse(null, { 
            message: "An employee with this CNIC already exists" 
          })
        );
      }
    }

    const employee = await employeeService.updateEmployee(id, vendorId, employeeData);
    
    if (!employee) {
      return res.status(200).json(
        util.createResponse(null, { message: "Employee not found" })
      );
    }

    res.status(200).json(
      util.createResponse(employee, null, "Employee updated successfully")
    );
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const employee = await employeeService.deleteEmployee(id, vendorId);
    
    if (!employee) {
      return res.status(200).json(
        util.createResponse(null, { message: "Employee not found" })
      );
    }

    res.status(200).json(
      util.createResponse(null, null, "Employee deleted successfully")
    );
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// exports.getActiveEmployees = async (req, res) => {
//   try {
//     const vendorId = req.vendor.id;

//     const employees = await employeeService.getActiveEmployees(vendorId);
    
//     res.status(200).json(
//       util.createResponse(employees, null, "Active employees retrieved successfully")
//     );
//   } catch (error) {
//     console.error('Error in getActiveEmployees:', error);
//     res.status(200).json(
//       util.createResponse(null, error)
//     );
//   }
// };

exports.getEmployeesByDesignation = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { designation } = req.params;

    const employees = await employeeService.getEmployeesByDesignation(vendorId, designation);
    
    res.status(200).json(
      util.createResponse(employees, null, `${designation} employees retrieved successfully`)
    );
  } catch (error) {
    console.error('Error in getEmployeesByDesignation:', error);
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const employee = await employeeService.toggleEmployeeStatus(id, vendorId);
    if (!employee) {
      return res.status(200).json(util.createResponse(null, { message: "No Employee Found or Unauthorized" }));
    }
    
    const statusText = employee.isActive ? "activated" : "deactivated";
    res.status(200).json(util.createResponse(employee, null, `Employee ${statusText}`));
  } catch (error) {
    console.error('Employee status toggle error:', error);
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getEmployeesByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const filters = req.query;

    const employees = await employeeService.getEmployeesByVendor(vendorId, filters);
    
    res.status(200).json(
      util.createResponse(employees, null, "Employees retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getEmployeesByVendor:', error);
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};


//   try {
//     const vendorId = req.vendor.id;
//     const filters = req.query;

//     const employees = await employeeService.getEmployeesByVendor(vendorId, filters);
    
//     res.status(200).json(
//       util.createResponse(employees, null, "My employees retrieved successfully")
//     );
//   } catch (error) {
//     console.error('Error in getMyEmployees:', error);
//     res.status(200).json(
//       util.createResponse(null, error)
//     );
//   }
// };
