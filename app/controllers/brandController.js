const brandService = require("../services/brandService");
const util = require("../util/util");
const { PROVINCES, PROVINCE_ENUM } = require("../constants/provinces");
const { CITIES, getCitiesByProvince } = require("../constants/cities");

exports.createBrand = async (req, res) => {
  try {
    const { name, province, city, address, primaryContact, secondaryContact } = req.body;
    
    // Basic validation
    if (!name || !province || !city || !address || !primaryContact || !secondaryContact) {
      return res.status(400).json(util.createResponse(null, { message: "All fields are required" }));
    }

    const brandData = {
      name: name.trim(),
      province,
      city,
      address: address.trim(),
      primaryContact: primaryContact.trim(),
      secondaryContact: secondaryContact.trim()
    };

    const brand = await brandService.createBrand(brandData);
    res.status(201).json(util.createResponse(brand, null, "Brand created successfully"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getAllBrands = async (req, res) => {
  const page = parseInt(req.query.pageNumber) || 1;
  const limit = parseInt(req.query.pageSize) || 10;
  const keyword = req.query.keyword || "";
  const status = req.query.status || "active"; // "active", "inactive", "all"

  try {
    // Add no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': false
    });

    const brands = await brandService.getAllBrands(page, limit, keyword, status);
    res.status(200).json(util.createResponse(brands, null, "All Brands"));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) {
      return res.status(200).json(util.createResponse(null, { message: "No Brand Found" }));
    }
    res.status(200).json(util.createResponse(brand, null, "Brand Found"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getBrandByBrandId = async (req, res) => {
  try {
    const brand = await brandService.getBrandByBrandId(req.params.brandId);
    if (!brand) {
      return res.status(200).json(util.createResponse(null, { message: "No Brand Found" }));
    }
    res.status(200).json(util.createResponse(brand, null, "Brand Found"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const updatedBrand = await brandService.updateBrand(req.params.id, req.body);
    if (!updatedBrand) {
      return res.status(200).json(util.createResponse(null, { message: "No Brand Found" }));
    }
    res.status(200).json(util.createResponse(updatedBrand, null, "Brand Updated"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const deletedBrand = await brandService.deleteBrand(req.params.id);
    if (!deletedBrand) {
      return res.status(200).json(util.createResponse(null, { message: "No Brand Found" }));
    }
    res.status(200).json(util.createResponse(deletedBrand, null, "Brand Deleted"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getBrandsByProvince = async (req, res) => {
  try {
    const brands = await brandService.getBrandsByProvince(req.params.province);
    res.status(200).json(util.createResponse(brands, null, `Brands in ${req.params.province}`));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

exports.getBrandsByCity = async (req, res) => {
  try {
    const brands = await brandService.getBrandsByCity(req.params.city);
    res.status(200).json(util.createResponse(brands, null, `Brands in ${req.params.city}`));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};

// Get constants for frontend dropdowns
exports.getConstants = async (req, res) => {
  try {
    const constants = {
      provinces: PROVINCE_ENUM,
      cities: CITIES,
      provinceDetails: PROVINCES
    };
    res.status(200).json(util.createResponse(constants, null, "Brand Constants"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

// Get cities by province for dependent dropdown
exports.getCitiesByProvince = async (req, res) => {
  try {
    const { province } = req.params;
    const cities = getCitiesByProvince(province);
    res.status(200).json(util.createResponse(cities, null, `Cities in ${province}`));
  } catch (error) {
    res.status(200).json(util.createResponse([], error));
  }
};
