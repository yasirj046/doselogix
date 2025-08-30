const { PROVINCES } = require("../constants/provinces");
const { CITIES, getCitiesByProvince } = require("../constants/cities");
const { CUSTOMER_CATEGORIES } = require("../constants/customerCategories");
const { DESIGNATION_ENUM } = require("../constants/designations");
const Area = require("../models/areaModel");
const Brand = require("../models/brandModel");
const Group = require("../models/groupModel");
const Product = require("../models/productModel");

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
    // Get unique areas for the vendor
    const areas = await Area.distinct('area', { vendorId, isActive: true });
    return areas.map(area => ({
      label: area,
      value: area
    }));
  } catch (error) {
    console.error('Error in getAreasByVendor:', error);
    throw error;
  }
};

exports.getSubAreasByArea = async (vendorId, area) => {
  try {
    let query = { vendorId, isActive: true };
    if (area) {
      query.area = area;
    }
    
    // Get subareas for the specific area or all subareas
    const subareas = await Area.find(query).select('subArea area').sort({ subArea: 1 });
    
    // Filter out items where subArea is null/undefined and return only distinct subAreas
    const distinctSubAreas = [...new Set(
      subareas
        .filter(item => item.subArea && item.subArea.trim() !== '')
        .map(item => item.subArea)
    )];
    
    return distinctSubAreas.map(subArea => ({
      label: subArea,
      value: subArea
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
      .select('_id group subGroup brandId')
      .populate('brandId', 'brandName')
      .sort({ group: 1, subGroup: 1 });
    
    return groups.map(group => ({
      label: `${group.group} - ${group.subGroup}`,
      value: group._id.toString(),
      group: group.group,
      subGroup: group.subGroup,
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
      .select('_id group subGroup')
      .sort({ group: 1, subGroup: 1 });
    
    return groups.map(group => ({
      label: `${group.group} - ${group.subGroup}`,
      value: group._id.toString(),
      group: group.group,
      subGroup: group.subGroup
    }));
  } catch (error) {
    console.error('Error in getGroupsByBrand:', error);
    throw error;
  }
};

exports.getUniqueGroupNames = async (vendorId, brandId = null) => {
  try {
    let query = { vendorId, isActive: true };
    if (brandId) {
      query.brandId = brandId;
    }
    
    const uniqueGroups = await Group.distinct('group', query);
    
    return uniqueGroups.sort().map(group => ({
      label: group,
      value: group
    }));
  } catch (error) {
    console.error('Error in getUniqueGroupNames:', error);
    throw error;
  }
};

exports.getSubGroupsByGroup = async (vendorId, groupName, brandId = null) => {
  try {
    if (!groupName) {
      throw new Error('Group name is required');
    }
    
    let query = { vendorId, group: groupName, isActive: true };
    if (brandId) {
      query.brandId = brandId;
    }
    
    const subGroups = await Group.find(query)
      .select('_id subGroup')
      .sort({ subGroup: 1 });
    
    return subGroups.map(group => ({
      label: group.subGroup,
      value: group._id.toString(),
      subGroup: group.subGroup
    }));
  } catch (error) {
    console.error('Error in getSubGroupsByGroup:', error);
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
    
    const products = await Product.find(query)
      .select('_id productName packingSize')
      .populate('brandId', 'brandName')
      .populate('groupId', 'group subGroup')
      .sort({ productName: 1 });
    
    return products.map(product => ({
      label: `${product.productName} (${product.packingSize})`,
      value: product._id.toString(),
      productName: product.productName,
      packingSize: product.packingSize,
      brandName: product.brandId?.brandName,
      groupName: product.groupId ? `${product.groupId.group} - ${product.groupId.subGroup}` : ''
    }));
  } catch (error) {
    console.error('Error in getProductsByFilters:', error);
    throw error;
  }
}; 