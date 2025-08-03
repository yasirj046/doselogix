const Employee = require("../models/employeeModel");
const EmployeeCounter = require("../models/employeeCounterModel");
const { CITIES } = require("../constants/cities");

// Generate unique employee ID
const generateEmployeeId = async (city) => {
  try {
    // Find city code from all provinces
    let cityCode = null;
    for (const province in CITIES) {
      if (CITIES[province][city]) {
        cityCode = CITIES[province][city].code;
        break;
      }
    }

    if (!cityCode) {
      throw new Error("Invalid city");
    }

    // Get next global sequence number
    const counter = await EmployeeCounter.findOneAndUpdate(
      {},
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    // Format: cityCode + globalSequence (padded to 2 digits)
    const employeeId = `${cityCode}${counter.sequence.toString().padStart(2, '0')}`;
    
    return employeeId;
  } catch (error) {
    throw error;
  }
};

exports.createEmployee = async (employeeData) => {
  try {
    const employeeId = await generateEmployeeId(employeeData.city);
    const employee = new Employee({
      ...employeeData,
      employeeId
    });
    return await employee.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllEmployees = async (page, limit, keyword) => {
  let query = { isActive: true };
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Employee.paginate(query, { 
    page, 
    limit, 
    sort: { createdAt: -1 }
  });
};

exports.getEmployeeById = async (id) => {
  return await Employee.findOne({ _id: id, isActive: true });
};

exports.getEmployeeByEmployeeId = async (employeeId) => {
  return await Employee.findOne({ employeeId, isActive: true });
};

exports.updateEmployee = async (id, employeeData) => {
  // Remove employeeId from update data to prevent modification
  const { employeeId, ...updateData } = employeeData;
  return await Employee.findOneAndUpdate(
    { _id: id, isActive: true }, 
    updateData, 
    { new: true, runValidators: true }
  );
};

exports.deleteEmployee = async (id) => {
  // Soft delete - mark as inactive
  return await Employee.findByIdAndUpdate(
    id, 
    { isActive: false }, 
    { new: true }
  );
};

exports.getEmployeesByProvince = async (province) => {
  return await Employee.find({ province, isActive: true }).sort({ createdAt: -1 });
};

exports.getEmployeesByCity = async (city) => {
  return await Employee.find({ city, isActive: true }).sort({ createdAt: -1 });
};

exports.getEmployeesByDesignation = async (designation) => {
  return await Employee.find({ designation, isActive: true }).sort({ createdAt: -1 });
};

exports.restoreEmployee = async (id) => {
  // Restore soft-deleted employee
  return await Employee.findByIdAndUpdate(
    id, 
    { isActive: true }, 
    { new: true }
  );
};

exports.getDeletedEmployees = async () => {
  // Get all soft-deleted employees
  return await Employee.find({ isActive: false }).sort({ createdAt: -1 });
};

exports.getEmployeesBySalaryRange = async (minSalary, maxSalary) => {
  return await Employee.find({ 
    salary: { $gte: minSalary, $lte: maxSalary },
    isActive: true 
  }).sort({ salary: -1 });
};

exports.searchEmployees = async (filters) => {
  let query = { isActive: true };
  
  if (filters.province) query.province = filters.province;
  if (filters.city) query.city = filters.city;
  if (filters.designation) query.designation = filters.designation;
  if (filters.minSalary || filters.maxSalary) {
    query.salary = {};
    if (filters.minSalary) query.salary.$gte = filters.minSalary;
    if (filters.maxSalary) query.salary.$lte = filters.maxSalary;
  }
  
  return await Employee.find(query).sort({ createdAt: -1 });
};
