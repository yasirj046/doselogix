const Brand = require('../models/brandModel');

exports.getAllBrands = async (page, limit, keyword, vendorId) => {
  try {
    const query = { vendorId };
    
    if (keyword) {
      query.$or = [
        { brandName: { $regex: keyword, $options: 'i' } },
        { brandCode: { $regex: keyword, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1 }
    };

    return await Brand.paginate(query, options);
  } catch (error) {
    throw error;
  }
};

exports.getBrandById = async (id) => {
  try {
    const brand = await Brand.findById(id);
    if (!brand) {
      throw new Error('Brand not found');
    }
    return brand;
  } catch (error) {
    throw error;
  }
};

exports.createBrand = async (vendorId, brandData) => {
  try {
    const brand = new Brand({
      vendorId,
      ...brandData
    });
    
    return await brand.save();
  } catch (error) {
    throw error;
  }
};

exports.updateBrand = async (vendorId, brandId, updateData) => {
  try {
    const brand = await Brand.findOne({ _id: brandId, vendorId });
    if (!brand) {
      throw new Error('Brand not found');
    }

    Object.assign(brand, updateData);
    return await brand.save();
  } catch (error) {
    throw error;
  }
};

exports.toggleBrandStatus = async (vendorId, brandId) => {
  try {
    const brand = await Brand.findOne({ _id: brandId, vendorId });
    if (!brand) {
      throw new Error('Brand not found');
    }

    brand.isActive = !brand.isActive;
    return await brand.save();
  } catch (error) {
    throw error;
  }
}; 