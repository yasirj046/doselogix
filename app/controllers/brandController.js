const brandService = require('../services/brandService');
const { createResponse } = require('../util/util');

exports.getAllBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const vendorId = req.vendor.id;

    const result = await brandService.getAllBrands(page, limit, keyword, status, vendorId);
    
    res.status(200).json(createResponse(result, null, "Brands retrieved successfully"));
  } catch (error) {
    console.error('Error in getAllBrands:', error);
    res.status(200).json(createResponse([], error));
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const brand = await brandService.getBrandById(id, vendorId);
    
    if (!brand) {
      return res.status(404).json(createResponse(null, "Brand not found"));
    }

    res.status(200).json(
      createResponse(brand, null, "Brand retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getBrandById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createBrand = async (req, res) => {
  try {    
    const brand = await brandService.createBrand(req.vendor.id, req.body);
    res.status(201).json(createResponse(brand));
  } catch (error) {
    console.error('Controller error creating brand:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const brand = await brandService.updateBrand(req.vendor.id, req.params.id, req.body);
    res.status(200).json(createResponse(brand));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleBrandStatus = async (req, res) => {
  try {
    const brand = await brandService.toggleBrandStatus(req.vendor.id, req.params.id);
    res.status(200).json(createResponse(brand));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message));
  }
}; 