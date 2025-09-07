const productService = require('../services/productService');
const { createResponse } = require('../util/util');

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const brandId = req.query.brandId || "";
    const groupId = req.query.groupId || "";
    const subGroupId = req.query.subGroupId || "";
    const vendorId = req.vendor.id;

    const result = await productService.getAllProducts(page, limit, keyword, status, vendorId, brandId, groupId, subGroupId);
    
    res.status(200).json(
      createResponse(result, null, "Products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const product = await productService.getProductById(id, vendorId);
    
    if (!product) {
      return res.status(404).json(createResponse(null, "Product not found"));
    }

    res.status(200).json(
      createResponse(product, null, "Product retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createProduct = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const productData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['brandId', 'productName', 'packingSize', 'cartonSize'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Trim string fields
    if (productData.productName) productData.productName = productData.productName.trim();
    if (productData.packingSize) productData.packingSize = productData.packingSize.trim();
    if (productData.cartonSize) productData.cartonSize = productData.cartonSize.trim();

    const createdProduct = await productService.createProduct(productData);
    
    res.status(201).json(createResponse(createdProduct, null, "Product created successfully"));
  } catch (error) {
    console.error('Create product error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Validation for required fields if they're being updated
    const requiredFields = ['brandId', 'productName', 'packingSize', 'cartonSize'];
    for (const field of requiredFields) {
      if (updateData.hasOwnProperty(field) && (!updateData[field] || updateData[field].toString().trim() === '')) {
        return res.status(400).json(
          createResponse(null, `${field} is required and cannot be empty`)
        );
      }
    }

    // Trim string fields if they exist in updateData
    const stringFields = ['productName', 'packingSize', 'cartonSize'];
    stringFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = updateData[field].trim();
      }
    });

    const updatedProduct = await productService.updateProduct(vendorId, productId, updateData);
    
    res.status(200).json(
      createResponse(updatedProduct, null, "Product updated successfully")
    );
  } catch (error) {
    console.error('Update product error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json(createResponse(null, error.message));
    }
    if (error.message === 'Product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleProductStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedProduct = await productService.toggleProductStatus(vendorId, productId);
    
    res.status(200).json(
      createResponse(updatedProduct, null, `Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`)
    );
  } catch (error) {
    console.error('Toggle product status error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getProductsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const vendorId = req.vendor.id;
    const { isActive, groupId } = req.query;

    const options = {};
    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }
    if (groupId) {
      options.groupId = groupId;
    }

    const products = await productService.getProductsByBrand(vendorId, brandId, options);
    
    res.status(200).json(
      createResponse(products, null, "Products by brand retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductsByBrand:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getProductsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const vendorId = req.vendor.id;
    const { isActive, brandId, subGroupId } = req.query;

    const options = {};
    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }
    if (brandId) {
      options.brandId = brandId;
    }
    if (subGroupId) {
      options.subGroupId = subGroupId;
    }

    const products = await productService.getProductsByGroup(vendorId, groupId, options);
    
    res.status(200).json(
      createResponse(products, null, "Products by group retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductsByGroup:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getProductsBySubGroup = async (req, res) => {
  try {
    const { subGroupId } = req.params;
    const vendorId = req.vendor.id;
    const { isActive, brandId, groupId } = req.query;

    const options = {};
    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }
    if (brandId) {
      options.brandId = brandId;
    }
    if (groupId) {
      options.groupId = groupId;
    }

    const products = await productService.getProductsBySubGroup(vendorId, subGroupId, options);
    
    res.status(200).json(
      createResponse(products, null, "Products by subgroup retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductsBySubGroup:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;

    const result = await productService.getMyProducts(vendorId, page, limit);
    
    res.status(200).json(
      createResponse(result, null, "My products retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getMyProducts:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const stats = await productService.getProductStats(vendorId);
    
    res.status(200).json(
      createResponse(stats, null, "Product statistics retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getProductStats:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await productService.deleteProduct(vendorId, productId);
    
    res.status(200).json(
      createResponse(result, null, "Product deleted successfully")
    );
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};
