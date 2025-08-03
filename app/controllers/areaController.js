const areaService = require("../services/areaService");

exports.createArea = async (req, res) => {
  try {
    const area = await areaService.createArea(req.body);
    res.status(201).json({
      success: true,
      message: "Area created successfully",
      data: area
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const keyword = req.query.keyword || "";
    
    const areas = await areaService.getAllAreas(page, limit, keyword);
    res.status(200).json({
      success: true,
      message: "Areas retrieved successfully",
      data: areas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAreasByCity = async (req, res) => {
  try {
    const areas = await areaService.getAreasByCity(req.params.city);
    res.status(200).json({
      success: true,
      message: "Areas retrieved successfully",
      data: areas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAreaById = async (req, res) => {
  try {
    const area = await areaService.getAreaById(req.params.id);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Area retrieved successfully",
      data: area
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const area = await areaService.updateArea(req.params.id, req.body);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Area updated successfully",
      data: area
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const area = await areaService.deleteArea(req.params.id);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Area deleted successfully",
      data: area
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchAreas = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const city = req.query.city || null;
    const areas = await areaService.searchAreas(keyword, city);
    res.status(200).json({
      success: true,
      message: "Areas retrieved successfully",
      data: areas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
