const brandService = require('../services/brandService');
const { createResponse } = require('../util/util');

exports.getAllBrands = async (req, res) => {
  try {
    const { page, limit, keyword } = req.query;
    const brands = await brandService.getAllBrands(page, limit, keyword, req.vendor.id);
    
    res.status(200).json(createResponse(brands));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.status(200).json(createResponse(brand));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createBrand = async (req, res) => {
  try {
    const brand = await brandService.createBrand(req.vendor.id, req.body);
    res.status(201).json(createResponse(brand));
  } catch (error) {
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