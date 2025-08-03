const Brand = require("../models/brandModel");
const BrandCounter = require("../models/brandCounterModel");
const { PROVINCES } = require("../constants/provinces");
const { CITIES } = require("../constants/cities");

// Generate unique brand ID
const generateBrandId = async (province, city) => {
  try {
    // Find province code
    const provinceEntry = Object.values(PROVINCES).find(p => p.name === province);
    if (!provinceEntry) {
      throw new Error("Invalid province");
    }

    // Find city code
    const cityEntry = CITIES[province] && CITIES[province][city];
    if (!cityEntry) {
      throw new Error("Invalid city for the selected province");
    }

    // Get next sequence number for this province
    const counter = await BrandCounter.findOneAndUpdate(
      { province },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    // Format: provinceCode + cityCode + provinceSequence (padded to 2 digits)
    const brandId = `${provinceEntry.code}${cityEntry.code}${counter.sequence.toString().padStart(2, '0')}`;
    
    return brandId;
  } catch (error) {
    throw error;
  }
};

exports.createBrand = async (brandData) => {
  try {
    const brandId = await generateBrandId(brandData.province, brandData.city);
    const brand = new Brand({
      ...brandData,
      brandId
    });
    return await brand.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllBrands = async (page, limit, keyword, status = "active") => {
  let query = {};
  
  // Handle status filter
  if (status === "active") {
    query.isActive = true;
  } else if (status === "inactive") {
    query.isActive = false;
  }
  // If status === "all", no filter applied
  
  if (keyword !== "") {
    query.$text = { $search: keyword };
  }
  
  return await Brand.paginate(query, { 
    page, 
    limit, 
    sort: { createdAt: -1 }
  });
};

exports.getBrandById = async (id) => {
  return await Brand.findOne({ _id: id });
};

exports.getBrandByBrandId = async (brandId) => {
  return await Brand.findOne({ brandId, isActive: true });
};

exports.updateBrand = async (id, brandData) => {
  // Remove brandId from update data to prevent modification
  const { brandId, ...updateData } = brandData;
  return await Brand.findOneAndUpdate(
    { _id: id }, 
    updateData, 
    { new: true }
  );
};

exports.deleteBrand = async (id) => {
  // Soft delete - mark as inactive
  return await Brand.findByIdAndUpdate(
    id, 
    { isActive: false }, 
    { new: true }
  );
};

exports.getBrandsByProvince = async (province) => {
  return await Brand.find({ province, isActive: true }).sort({ createdAt: -1 });
};

exports.getBrandsByCity = async (city) => {
  return await Brand.find({ city, isActive: true }).sort({ createdAt: -1 });
};

exports.restoreBrand = async (id) => {
  // Restore soft-deleted brand
  return await Brand.findByIdAndUpdate(
    id, 
    { isActive: true }, 
    { new: true }
  );
};

exports.getDeletedBrands = async () => {
  // Get all soft-deleted brands
  return await Brand.find({ isActive: false }).sort({ createdAt: -1 });
};
