const lookupService = require("../services/lookupService");
const util = require("../util/util");

exports.getAllProvinces = async (req, res) => {
  try {
    const provinces = await lookupService.getAllProvinces();
    res.status(200).json(util.createResponse(provinces, null, "All Provinces"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getCitiesByProvince = async (req, res) => {
  try {
    const { provinceName } = req.query;
    
    if (!provinceName) {
      return res.status(400).json(
        util.createResponse(null, { message: "Province name is required" })
      );
    }
    
    const cities = await lookupService.getCitiesByProvince(provinceName);
    res.status(200).json(util.createResponse(cities, null, `Cities in ${provinceName}`));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
}; 

exports.getCustomerCategories = async (req, res) => {
  try {
    const categories = await lookupService.getCustomerCategories();
    res.status(200).json(util.createResponse(categories, null, "All Customer Categories"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
}; 

exports.getDesignations = async (req, res) => {
  try {
    const designations = await lookupService.getDesignations();
    res.status(200).json(util.createResponse(designations, null, "All Designations"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const cities = await lookupService.getAllCities();
    res.status(200).json(util.createResponse(cities, null, "All Cities"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
}; 

exports.getAreasByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const areas = await lookupService.getAreasByVendor(vendorId);
    res.status(200).json(util.createResponse(areas, null, "Vendor Areas"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getSubAreasByArea = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { areaId } = req.query; // Changed from area to areaId
    const subareas = await lookupService.getSubAreasByArea(vendorId, areaId);
    res.status(200).json(util.createResponse(subareas, null, "Sub Areas"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
}; 

// Product-related lookup controllers
exports.getBrandsByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const brands = await lookupService.getBrandsByVendor(vendorId);
    res.status(200).json(util.createResponse(brands, null, "Vendor Brands"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getGroupsByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { brandId } = req.query;
    const groups = await lookupService.getGroupsByVendor(vendorId, brandId);
    res.status(200).json(util.createResponse(groups, null, "Vendor Groups"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getGroupsByBrand = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { brandId } = req.query;
    
    if (!brandId) {
      return res.status(400).json(
        util.createResponse(null, { message: "Brand ID is required" })
      );
    }
    
    const groups = await lookupService.getGroupsByBrand(vendorId, brandId);
    res.status(200).json(util.createResponse(groups, null, "Groups by Brand"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getUniqueGroupNames = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { brandId } = req.query;
    const groups = await lookupService.getUniqueGroupNames(vendorId, brandId);
    res.status(200).json(util.createResponse(groups, null, "Unique Group Names"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getSubGroupsByGroup = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { groupId, brandId } = req.query;
    
    const subGroups = await lookupService.getSubGroupsByGroup(vendorId, groupId, brandId);
    res.status(200).json(util.createResponse(subGroups, null, "Sub Groups"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getSubGroupsByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { brandId, groupId } = req.query;
    
    const subGroups = await lookupService.getSubGroupsByVendor(vendorId, brandId, groupId);
    res.status(200).json(util.createResponse(subGroups, null, "Sub Groups by Vendor"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getProductsByFilters = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { brandId, groupId, subGroupId } = req.query;
    
    const filters = {};
    if (brandId) filters.brandId = brandId;
    if (groupId) filters.groupId = groupId;
    if (subGroupId) filters.subGroupId = subGroupId;
    
    const products = await lookupService.getProductsByFilters(vendorId, filters);
    res.status(200).json(util.createResponse(products, null, "Products by Filters"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getCustomersByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const customers = await lookupService.getCustomersByVendor(vendorId);
    res.status(200).json(util.createResponse(customers, null, "Vendor Customers"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getEmployeesByVendor = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { designation } = req.query;
    
    const query = { vendorId, isActive: true };
    if (designation) {
      query.designation = designation;
    }
    
    const employees = await lookupService.getEmployeesByVendor(vendorId, query);
    res.status(200).json(util.createResponse(employees, null, "Vendor Employees"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await lookupService.getExpenseCategories();
    res.status(200).json(util.createResponse(categories, null, "All Expense Categories"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getAreasByCustomersWithSales = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const areas = await lookupService.getAreasByCustomersWithSales(vendorId);
    res.status(200).json(util.createResponse(areas, null, "Areas by Customers with Sales"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getSubAreasByCustomersWithSales = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { areaId } = req.query;
    const subAreas = await lookupService.getSubAreasByCustomersWithSales(vendorId, areaId);
    res.status(200).json(util.createResponse(subAreas, null, "Sub Areas by Customers with Sales"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};