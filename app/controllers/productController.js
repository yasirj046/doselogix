const productService = require("../services/productService");
const util = require("../util/util");

exports.createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(util.createResponse(product, null, "Product created successfully"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || "";
    
    const products = await productService.getAllProducts(page, limit, keyword);
    res.status(200).json(util.createResponse(products, null, "Products retrieved successfully"));
  } catch (error) {
    res.status(200).json(util.createResponse(null, error));
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductByProductId = async (req, res) => {
  try {
    const product = await productService.getProductByProductId(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductsByBrand = async (req, res) => {
  try {
    const products = await productService.getProductsByBrand(req.params.brandId);
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductsByGroup = async (req, res) => {
  try {
    const products = await productService.getProductsByGroup(req.params.groupId);
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductsBySubgroup = async (req, res) => {
  try {
    const products = await productService.getProductsBySubgroup(req.params.subgroupId);
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.restoreProduct = async (req, res) => {
  try {
    const product = await productService.restoreProduct(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Product restored successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDeletedProducts = async (req, res) => {
  try {
    const products = await productService.getDeletedProducts();
    res.status(200).json({
      success: true,
      message: "Deleted products retrieved successfully",
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const filters = {
      brand: req.query.brand,
      group: req.query.group,
      subgroup: req.query.subgroup,
      minPacking: req.query.minPacking ? parseInt(req.query.minPacking) : null,
      maxPacking: req.query.maxPacking ? parseInt(req.query.maxPacking) : null,
      minCartonSize: req.query.minCartonSize ? parseInt(req.query.minCartonSize) : null,
      maxCartonSize: req.query.maxCartonSize ? parseInt(req.query.maxCartonSize) : null
    };
    
    const products = await productService.searchProducts(filters);
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
