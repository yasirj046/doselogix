const Brand = require('../models/brandModel');

exports.getAllBrands = async (page, limit, keyword, status, vendorId) => {
  try {
    let query = {};
    
    // Filter by vendor if provided
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "Active";
    }
    
    if (keyword && keyword !== "") {
      query.$or = [
        { brandName: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } },
        { primaryContact: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await Brand.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: {
        path: 'vendorId',
        select: 'vendorName vendorEmail'
      }
    });
  } catch (error) {
    console.error('Error in getAllBrands:', error);
    throw error;
  }
};

exports.getBrandById = async (id, vendorId) => {
  try {
    const brand = await Brand.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail');
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
    
    const savedBrand = await brand.save();
    return savedBrand;
  } catch (error) {
    console.error('Error creating brand:', error);
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