const Product = require('../models/productModel');

exports.getAllProducts = async (page, limit, keyword, status, vendorId, brandId, groupId, subGroupId) => {
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
    
    // Filter by brand if provided
    if (brandId && brandId !== "") {
      query.brandId = brandId;
    }
    
    // Filter by group if provided
    if (groupId && groupId !== "") {
      query.groupId = groupId;
    }
    
    // Filter by subgroup if provided
    if (subGroupId && subGroupId !== "") {
      query.subGroupId = subGroupId;
    }
    
    // Search by keyword in product name and packaging details
    if (keyword && keyword !== "") {
      query.$or = [
        { productName: { $regex: keyword, $options: 'i' } },
        { packingSize: { $regex: keyword, $options: 'i' } },
        { cartonSize: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await Product.paginate(query, { 
      page, 
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        },
        {
          path: 'brandId',
          select: 'brandName'
        },
        {
          path: 'groupId',
          select: 'groupName'
        },
        {
          path: 'subGroupId',
          select: 'subGroupName'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
};

exports.getProductById = async (id, vendorId) => {
  try {
    const product = await Product.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName');
      
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    throw error;
  }
};

exports.createProduct = async (productData) => {
  try {
    // Check if product with same name already exists for this vendor, brand, group, and subgroup
    const existingProduct = await Product.findOne({
      vendorId: productData.vendorId,
      brandId: productData.brandId,
      groupId: productData.groupId,
      subGroupId: productData.subGroupId,
      productName: productData.productName
    });

    if (existingProduct) {
      throw new Error(`Product with name "${productData.productName}" already exists for this brand, group, and subgroup`);
    }

    const product = new Product(productData);
    const savedProduct = await product.save();
    
    // Return the populated product
    return await Product.findById(savedProduct._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName');
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

exports.updateProduct = async (vendorId, productId, updateData) => {
  try {
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      throw new Error('Product not found');
    }

    // Check for duplicate product name if productName is being updated
    if (updateData.productName && updateData.productName !== product.productName) {
      const existingProduct = await Product.findOne({
        vendorId,
        brandId: updateData.brandId || product.brandId,
        groupId: updateData.groupId || product.groupId,
        subGroupId: updateData.subGroupId || product.subGroupId,
        productName: updateData.productName,
        _id: { $ne: productId }
      });

      if (existingProduct) {
        throw new Error(`Product with name "${updateData.productName}" already exists for this brand, group, and subgroup`);
      }
    }

    Object.assign(product, updateData);
    const updatedProduct = await product.save();
    
    // Return the populated product
    return await Product.findById(updatedProduct._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName');
  } catch (error) {
    throw error;
  }
};

exports.toggleProductStatus = async (vendorId, productId) => {
  try {
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      throw new Error('Product not found');
    }

    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    
    // Return the populated product
    return await Product.findById(updatedProduct._id)
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName');
  } catch (error) {
    throw error;
  }
};

exports.getProductsByBrand = async (vendorId, brandId, options = {}) => {
  try {
    const query = { vendorId, brandId };
    
    if (typeof options.isActive === 'boolean') {
      query.isActive = options.isActive;
    }
    
    if (options.groupId) {
      query.groupId = options.groupId;
    }
    
    if (options.subGroupId) {
      query.subGroupId = options.subGroupId;
    }
    
    return await Product.find(query)
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName')
      .sort({ productName: 1 });
  } catch (error) {
    throw error;
  }
};

exports.getProductsByGroup = async (vendorId, groupId, options = {}) => {
  try {
    const query = { vendorId, groupId };
    
    if (typeof options.isActive === 'boolean') {
      query.isActive = options.isActive;
    }
    
    if (options.brandId) {
      query.brandId = options.brandId;
    }
    
    if (options.subGroupId) {
      query.subGroupId = options.subGroupId;
    }
    
    return await Product.find(query)
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName')
      .sort({ productName: 1 });
  } catch (error) {
    throw error;
  }
};

exports.getProductsBySubGroup = async (vendorId, subGroupId, options = {}) => {
  try {
    const query = { vendorId, subGroupId };
    
    if (typeof options.isActive === 'boolean') {
      query.isActive = options.isActive;
    }
    
    if (options.brandId) {
      query.brandId = options.brandId;
    }
    
    if (options.groupId) {
      query.groupId = options.groupId;
    }
    
    return await Product.find(query)
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName')
      .sort({ productName: 1 });
  } catch (error) {
    throw error;
  }
};

exports.getMyProducts = async (vendorId, page = 1, limit = 10) => {
  try {
    const query = { vendorId, isActive: true };
    
    return await Product.paginate(query, {
      page,
      limit,
      sort: { productName: 1 },
      populate: [
        {
          path: 'brandId',
          select: 'brandName'
        },
        {
          path: 'groupId',
          select: 'groupName'
        },
        {
          path: 'subGroupId',
          select: 'subGroupName'
        }
      ]
    });
  } catch (error) {
    throw error;
  }
};

exports.getProductStats = async (vendorId) => {
  try {
    const totalProducts = await Product.countDocuments({ vendorId });
    const activeProducts = await Product.countDocuments({ vendorId, isActive: true });
    const inactiveProducts = await Product.countDocuments({ vendorId, isActive: false });
    
    // Get products by brand
    const productsByBrand = await Product.aggregate([
      { $match: { vendorId: vendorId } },
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
      { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      { $project: { brandName: '$brand.brandName', count: 1 } },
      { $sort: { count: -1 } }
    ]);
    
    // Get products by group
    const productsByGroup = await Product.aggregate([
      { $match: { vendorId: vendorId } },
      { $group: { _id: '$groupId', count: { $sum: 1 } } },
      { $lookup: { from: 'groups', localField: '_id', foreignField: '_id', as: 'group' } },
      { $unwind: '$group' },
      { $project: { groupName: '$group.groupName', count: 1 } },
      { $sort: { count: -1 } }
    ]);
    
    // Get products by sub group
    const productsBySubGroup = await Product.aggregate([
      { $match: { vendorId: vendorId } },
      { $group: { _id: '$subGroupId', count: { $sum: 1 } } },
      { $lookup: { from: 'subgroups', localField: '_id', foreignField: '_id', as: 'subgroup' } },
      { $unwind: '$subgroup' },
      { $project: { subGroupName: '$subgroup.subGroupName', count: 1 } },
      { $sort: { count: -1 } }
    ]);
    
    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      productsByBrand,
      productsByGroup,
      productsBySubGroup
    };
  } catch (error) {
    throw error;
  }
};

exports.deleteProduct = async (vendorId, productId) => {
  try {
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      throw new Error('Product not found');
    }

    await Product.findByIdAndDelete(productId);
    return { message: 'Product deleted successfully' };
  } catch (error) {
    throw error;
  }
};
