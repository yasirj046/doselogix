const { PROVINCES } = require("../constants/provinces");
const { CITIES, getCitiesByProvince } = require("../constants/cities");
const { CUSTOMER_CATEGORIES } = require("../constants/customerCategories");
const { DESIGNATION_ENUM } = require("../constants/designations");
const Area = require("../models/areaModel");
const SubArea = require("../models/subAreaModel");
const Brand = require("../models/brandModel");
const Group = require("../models/groupModel");
const SubGroup = require("../models/subGroupModel");
const Product = require("../models/productModel");
const UserCustomers = require("../models/userCustomersModel");
const Employee = require("../models/employeeModel");

exports.getAllProvinces = async () => {
  try {
    return PROVINCES;
  } catch (error) {
    console.error('Error in getAllProvinces:', error);
    throw error;
  }
};

exports.getCitiesByProvince = async (provinceName) => {
  try {
    if (!provinceName) {
      throw new Error('Province name is required');
    }
    
    const cities = CITIES.filter(city => city.province === provinceName);
    return cities;
  } catch (error) {
    console.error('Error in getCitiesByProvince:', error);
    throw error;
  }
};

exports.getCustomerCategories = async () => {
  try {
    return CUSTOMER_CATEGORIES;
  } catch (error) {
    console.error('Error in getCustomerCategories:', error);
    throw error;
  }
}; 

exports.getDesignations = async () => {
  try {
    return DESIGNATION_ENUM.map(designation => ({
      label: designation,
      value: designation
    }));
  } catch (error) {
    console.error('Error in getDesignations:', error);
    throw error;
  }
};

exports.getAllCities = async () => {
  try {
    return CITIES;
  } catch (error) {
    console.error('Error in getAllCities:', error);
    throw error;
  }
}; 

exports.getAreasByVendor = async (vendorId) => {
  try {
    // Get areas for the vendor with their names
    const areas = await Area.find({ vendorId, isActive: true })
      .select('_id area')
      .sort({ area: 1 });
    
    return areas.map(area => ({
      label: area.area,
      value: area._id.toString() // Return ObjectId as string for frontend selection
    }));
  } catch (error) {
    console.error('Error in getAreasByVendor:', error);
    throw error;
  }
};

exports.getSubAreasByArea = async (vendorId, areaId) => {
  try {
    let query = { vendorId, isActive: true };
    
    // If areaId is provided, filter by specific area
    if (areaId) {
      query.areaId = areaId;
    }
    
    // Get sub areas for the specific area or all sub areas for the vendor
    const subAreas = await SubArea.find(query)
      .select('_id subAreaName areaId')
      .populate('areaId', 'area')
      .sort({ subAreaName: 1 });
    
    return subAreas.map(subArea => ({
      label: subArea.subAreaName,
      value: subArea._id.toString(), // Return ObjectId as string for frontend
      areaId: subArea.areaId._id.toString(),
      areaName: subArea.areaId.area
    }));
  } catch (error) {
    console.error('Error in getSubAreasByArea:', error);
    throw error;
  }
};

// Product-related lookup services
exports.getBrandsByVendor = async (vendorId) => {
  try {
    const brands = await Brand.find({ vendorId, isActive: true })
      .select('_id brandName')
      .sort({ brandName: 1 });
    
    return brands.map(brand => ({
      label: brand.brandName,
      value: brand._id.toString()
    }));
  } catch (error) {
    console.error('Error in getBrandsByVendor:', error);
    throw error;
  }
};

exports.getGroupsByVendor = async (vendorId, brandId = null) => {
  try {
    let query = { vendorId, isActive: true };
    if (brandId) {
      query.brandId = brandId;
    }
    
    const groups = await Group.find(query)
      .select('_id groupName brandId')
      .populate('brandId', 'brandName')
      .sort({ groupName: 1 });
    
    return groups.map(group => ({
      label: group.groupName,
      value: group._id.toString(),
      groupName: group.groupName,
      brandId: group.brandId._id.toString(),
      brandName: group.brandId.brandName
    }));
  } catch (error) {
    console.error('Error in getGroupsByVendor:', error);
    throw error;
  }
};

exports.getGroupsByBrand = async (vendorId, brandId) => {
  try {
    if (!brandId) {
      throw new Error('Brand ID is required');
    }
    
    const groups = await Group.find({ vendorId, brandId, isActive: true })
      .select('_id groupName')
      .sort({ groupName: 1 });
    
    return groups.map(group => ({
      label: group.groupName,
      value: group._id.toString(),
      groupName: group.groupName
    }));
  } catch (error) {
    console.error('Error in getGroupsByBrand:', error);
    throw error;
  }
};

exports.getSubGroupsByGroup = async (vendorId, groupId, brandId = null) => {
  try {
    let query = { vendorId, isActive: true };
    
    // If groupId is provided, filter by specific group
    if (groupId) {
      query.groupId = groupId;
    }
    
    // Get sub groups for the specific group or all sub groups for the vendor
    const subGroups = await SubGroup.find(query)
      .select('_id subGroupName groupId')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      })
      .sort({ subGroupName: 1 });
    
    // If brand filter is provided, filter by brand
    let filteredSubGroups = subGroups;
    if (brandId) {
      filteredSubGroups = subGroups.filter(subGroup => 
        subGroup.groupId && subGroup.groupId.brandId && 
        subGroup.groupId.brandId._id.toString() === brandId
      );
    }
    
    return filteredSubGroups.map(subGroup => ({
      label: subGroup.subGroupName,
      value: subGroup._id.toString(),
      subGroupName: subGroup.subGroupName,
      groupId: subGroup.groupId._id.toString(),
      groupName: subGroup.groupId.groupName,
      brandId: subGroup.groupId.brandId._id.toString(),
      brandName: subGroup.groupId.brandId.brandName
    }));
  } catch (error) {
    console.error('Error in getSubGroupsByGroup:', error);
    throw error;
  }
};

exports.getSubGroupsByVendor = async (vendorId, brandId = null, groupId = null) => {
  try {
    let query = { vendorId, isActive: true };
    
    // If groupId is provided, filter by specific group
    if (groupId) {
      query.groupId = groupId;
    }
    
    // Get sub groups for the vendor
    const subGroups = await SubGroup.find(query)
      .select('_id subGroupName groupId')
      .populate({
        path: 'groupId',
        select: 'groupName brandId',
        populate: {
          path: 'brandId',
          select: 'brandName'
        }
      })
      .sort({ subGroupName: 1 });
    
    // If brand filter is provided, filter by brand
    let filteredSubGroups = subGroups;
    if (brandId) {
      filteredSubGroups = subGroups.filter(subGroup => 
        subGroup.groupId && subGroup.groupId.brandId && 
        subGroup.groupId.brandId._id.toString() === brandId
      );
    }
    
    return filteredSubGroups.map(subGroup => ({
      label: subGroup.subGroupName,
      value: subGroup._id.toString(),
      subGroupName: subGroup.subGroupName,
      groupId: subGroup.groupId._id.toString(),
      groupName: subGroup.groupId.groupName,
      brandId: subGroup.groupId.brandId._id.toString(),
      brandName: subGroup.groupId.brandId.brandName
    }));
  } catch (error) {
    console.error('Error in getSubGroupsByVendor:', error);
    throw error;
  }
};

exports.getProductsByFilters = async (vendorId, filters = {}) => {
  try {
    let query = { vendorId, isActive: true };
    
    if (filters.brandId) {
      query.brandId = filters.brandId;
    }
    
    if (filters.groupId) {
      query.groupId = filters.groupId;
    }
    
    if (filters.subGroupId) {
      query.subGroupId = filters.subGroupId;
    }
    
    const products = await Product.find(query)
      .select('_id productName packingSize')
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName')
      .sort({ productName: 1 });
    
    return products.map(product => ({
      label: `${product.productName} (${product.packingSize})`,
      value: product._id.toString(),
      productName: product.productName,
      packingSize: product.packingSize,
      brandName: product.brandId?.brandName,
      groupName: product.groupId?.groupName,
      subGroupName: product.subGroupId?.subGroupName
    }));
  } catch (error) {
    console.error('Error in getProductsByFilters:', error);
    throw error;
  }
};

exports.getCustomersByVendor = async (vendorId) => {
  try {
    const customers = await UserCustomers.find({ vendorId, isActive: true })
      .select('_id customerName customerLicenseNumber customerLicenseExpiryDate')
      .sort({ customerName: 1 });
    
    return customers.map(customer => ({
      label: customer.customerName,
      value: customer._id.toString(),
      customerLicenseNumber: customer.customerLicenseNumber,
      customerLicenseExpiryDate: customer.customerLicenseExpiryDate
    }));
  } catch (error) {
    console.error('Error in getCustomersByVendor:', error);
    throw error;
  }
};

exports.getEmployeesByVendor = async (vendorId) => {
  try {
    const employees = await Employee.find({ vendorId, isActive: true })
      .select('_id employeeName designation')
      .sort({ employeeName: 1 });
    
    return employees.map(employee => ({
      label: employee.employeeName,
      value: employee._id.toString(),
      designation: employee.designation
    }));
  } catch (error) {
    console.error('Error in getEmployeesByVendor:', error);
    throw error;
  }
};

exports.getExpenseCategories = async () => {
  try {
    const { EXPENSE_CATEGORIES } = require("../constants/expenseCategories");
    return EXPENSE_CATEGORIES;
  } catch (error) {
    console.error('Error in getExpenseCategories:', error);
    throw error;
  }
}; 