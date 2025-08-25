const { PROVINCES } = require("../constants/provinces");
const { CITIES, getCitiesByProvince } = require("../constants/cities");
const { CUSTOMER_CATEGORIES } = require("../constants/customerCategories");

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