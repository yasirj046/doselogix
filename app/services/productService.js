const Product = require("../models/productModel");
const ProductCounter = require("../models/productCounterModel");
const Brand = require("../models/brandModel");
const { CITIES } = require("../constants/cities");

// Generate unique product ID
const generateProductId = async (brandId) => {
  try {
    // Get brand details
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw new Error("Invalid brand");
    }

    // Find city code
    let cityCode = null;
    for (const province in CITIES) {
      if (CITIES[province][brand.city]) {
        cityCode = CITIES[province][brand.city].code;
        break;
      }
    }

    if (!cityCode) {
      throw new Error("Invalid city for brand");
    }

    // Extract brand code (last 2 digits of brandId)
    const brandCode = brand.brandId.slice(-2);

    // Get next sequence number for this brand
    const counter = await ProductCounter.findOneAndUpdate(
      { brand: brandId },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    // Format: cityCode + brandCode + sequence (padded to 2 digits)
    const productId = `${cityCode}${brandCode}${counter.sequence.toString().padStart(2, '0')}`;
    
    return productId;
  } catch (error) {
    throw error;
  }
};

exports.createProduct = async (productData) => {
  try {
    const productId = await generateProductId(productData.brand);
    const product = new Product({
      ...productData,
      productId
    });
    return await product.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllProducts = async (page, limit, keyword) => {
  let query = { isActive: true };
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Product.paginate(query, { 
    page, 
    limit, 
    sort: { createdAt: -1 },
    populate: [
      { path: 'brand', select: 'name brandId city province' },
      { path: 'group', select: 'name' },
      { path: 'subgroup', select: 'name' }
    ]
  });
};

exports.getProductById = async (id) => {
  return await Product.findOne({ _id: id, isActive: true })
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name');
};

exports.getProductByProductId = async (productId) => {
  return await Product.findOne({ productId, isActive: true })
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name');
};

exports.updateProduct = async (id, productData) => {
  // Remove productId from update data to prevent modification
  const { productId, ...updateData } = productData;
  return await Product.findOneAndUpdate(
    { _id: id, isActive: true }, 
    updateData, 
    { new: true, runValidators: true }
  ).populate('brand', 'name brandId city province')
   .populate('group', 'name')
   .populate('subgroup', 'name');
};

exports.deleteProduct = async (id) => {
  // Soft delete - mark as inactive
  return await Product.findByIdAndUpdate(
    id, 
    { isActive: false }, 
    { new: true }
  );
};

exports.getProductsByBrand = async (brandId) => {
  return await Product.find({ brand: brandId, isActive: true })
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name')
    .sort({ createdAt: -1 });
};

exports.getProductsByGroup = async (groupId) => {
  return await Product.find({ group: groupId, isActive: true })
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name')
    .sort({ createdAt: -1 });
};

exports.getProductsBySubgroup = async (subgroupId) => {
  return await Product.find({ subgroup: subgroupId, isActive: true })
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name')
    .sort({ createdAt: -1 });
};

exports.restoreProduct = async (id) => {
  // Restore soft-deleted product
  return await Product.findByIdAndUpdate(
    id, 
    { isActive: true }, 
    { new: true }
  );
};

exports.getDeletedProducts = async () => {
  // Get all soft-deleted products
  return await Product.find({ isActive: false })
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name')
    .sort({ createdAt: -1 });
};

exports.searchProducts = async (filters) => {
  let query = { isActive: true };
  
  if (filters.brand) query.brand = filters.brand;
  if (filters.group) query.group = filters.group;
  if (filters.subgroup) query.subgroup = filters.subgroup;
  if (filters.minPacking || filters.maxPacking) {
    query.packing = {};
    if (filters.minPacking) query.packing.$gte = filters.minPacking;
    if (filters.maxPacking) query.packing.$lte = filters.maxPacking;
  }
  if (filters.minCartonSize || filters.maxCartonSize) {
    query.cartonSize = {};
    if (filters.minCartonSize) query.cartonSize.$gte = filters.minCartonSize;
    if (filters.maxCartonSize) query.cartonSize.$lte = filters.maxCartonSize;
  }
  
  return await Product.find(query)
    .populate('brand', 'name brandId city province')
    .populate('group', 'name')
    .populate('subgroup', 'name')
    .sort({ createdAt: -1 });
};
