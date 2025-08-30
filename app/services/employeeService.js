const Employee = require("../models/employeeModel");

exports.getAllEmployees = async (page, limit, keyword, designation, status, vendorId) => {
  try {
    let query = {};
    
    // Filter by vendor if provided
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Filter by designation if provided
    if (designation && designation !== "") {
      query.designation = designation;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    if (keyword && keyword !== "") {
      query.$or = [
        { employeeName: { $regex: keyword, $options: 'i' } },
        { city: { $regex: keyword, $options: 'i' } },
        { designation: { $regex: keyword, $options: 'i' } },
        { cnic: { $regex: keyword, $options: 'i' } },
        { primaryContact: { $regex: keyword, $options: 'i' } },
        { referencePerson: { $regex: keyword, $options: 'i' } },
        { referencePersonContact: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    return await Employee.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: {
        path: 'vendorId',
        select: 'vendorName vendorEmail'
      }
    });
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    throw error;
  }
};

exports.getEmployeeById = async (id, vendorId) => {
  try {
    return await Employee.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail vendorPhone businessName');
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    throw error;
  }
};

exports.createEmployee = async (employeeData) => {
  try {
    const employee = new Employee(employeeData);
    await employee.save();
    return await employee.populate('vendorId', 'vendorName vendorEmail vendorPhone businessName');
  } catch (error) {
    console.error('Error in createEmployee:', error);
    throw error;
  }
};

exports.updateEmployee = async (id, vendorId, employeeData) => {
  try {
    return await Employee.findOneAndUpdate(
      { _id: id, vendorId: vendorId },
      employeeData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    throw error;
  }
};

exports.deleteEmployee = async (id, vendorId) => {
  try {
    return await Employee.findOneAndDelete({ _id: id, vendorId });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    throw error;
  }
};

// exports.getActiveEmployees = async (vendorId) => {
//   try {
//     return await Employee.find({ vendorId, isActive: true })
//       .select('employeeName designation primaryContact')
//       .sort({ employeeName: 1 });
//   } catch (error) {
//     console.error('Error in getActiveEmployees:', error);
//     throw error;
//   }
// };

exports.getEmployeesByDesignation = async (vendorId, designation) => {
  try {
    return await Employee.find({ vendorId, designation, isActive: true })
      .select('employeeName primaryContact city')
      .sort({ employeeName: 1 });
  } catch (error) {
    console.error('Error in getEmployeesByDesignation:', error);
    throw error;
  }
};

exports.checkCnicExists = async (cnic, vendorId, excludeId = null) => {
  try {
    const query = { cnic, vendorId };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const employee = await Employee.findOne(query);
    return !!employee;
  } catch (error) {
    console.error('Error in checkCnicExists:', error);
    throw error;
  }
};

exports.toggleEmployeeStatus = async (id, vendorId) => {
  try {
    // First find the current employee to get current isActive state
    const currentEmployee = await Employee.findOne({ _id: id, vendorId: vendorId });
    if (!currentEmployee) {
      return null;
    }

    // Toggle the isActive status
    const employee = await Employee.findOneAndUpdate(
      { _id: id, vendorId: vendorId },
      { isActive: !currentEmployee.isActive },
      { 
        new: true,
        populate: {
          path: 'vendorId',
          select: 'vendorName vendorEmail vendorPhone businessName'
        }
      }
    );
    
    return employee;
  } catch (error) {
    console.error('Error in toggleEmployeeStatus:', error);
    throw error;
  }
};

exports.getEmployeesByVendor = async (vendorId, filters = {}) => {
  try {
    const query = { vendorId };
    
    // Add filters if provided
    if (filters.designation) {
      query.designation = filters.designation;
    }
    if (filters.city) {
      query.city = filters.city;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }
    
    return await Employee.find(query)
      .populate('vendorId', 'vendorName vendorEmail')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error in getEmployeesByVendor:', error);
    throw error;
  }
};
