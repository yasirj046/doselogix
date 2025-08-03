const subAreaService = require("../services/subAreaService");

exports.createSubArea = async (req, res) => {
  try {
    const subArea = await subAreaService.createSubArea(req.body);
    res.status(201).json({
      success: true,
      message: "Sub-area created successfully",
      data: subArea
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllSubAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const keyword = req.query.keyword || "";
    
    const subAreas = await subAreaService.getAllSubAreas(page, limit, keyword);
    res.status(200).json({
      success: true,
      message: "Sub-areas retrieved successfully",
      data: subAreas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSubAreasByArea = async (req, res) => {
  try {
    const subAreas = await subAreaService.getSubAreasByArea(req.params.areaId);
    res.status(200).json({
      success: true,
      message: "Sub-areas retrieved successfully",
      data: subAreas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSubAreaById = async (req, res) => {
  try {
    const subArea = await subAreaService.getSubAreaById(req.params.id);
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: "Sub-area not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Sub-area retrieved successfully",
      data: subArea
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSubArea = async (req, res) => {
  try {
    const subArea = await subAreaService.updateSubArea(req.params.id, req.body);
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: "Sub-area not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Sub-area updated successfully",
      data: subArea
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteSubArea = async (req, res) => {
  try {
    const subArea = await subAreaService.deleteSubArea(req.params.id);
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: "Sub-area not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Sub-area deleted successfully",
      data: subArea
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchSubAreas = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const areaId = req.query.areaId || null;
    const subAreas = await subAreaService.searchSubAreas(keyword, areaId);
    res.status(200).json({
      success: true,
      message: "Sub-areas retrieved successfully",
      data: subAreas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
