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