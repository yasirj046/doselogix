const subgroupService = require("../services/subgroupService");

exports.createSubgroup = async (req, res) => {
  try {
    const subgroup = await subgroupService.createSubgroup(req.body);
    res.status(201).json({
      success: true,
      message: "Subgroup created successfully",
      data: subgroup
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllSubgroups = async (req, res) => {
  try {
    const subgroups = await subgroupService.getAllSubgroups();
    res.status(200).json({
      success: true,
      message: "Subgroups retrieved successfully",
      data: subgroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSubgroupsByGroup = async (req, res) => {
  try {
    const subgroups = await subgroupService.getSubgroupsByGroup(req.params.groupId);
    res.status(200).json({
      success: true,
      message: "Subgroups retrieved successfully",
      data: subgroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSubgroupById = async (req, res) => {
  try {
    const subgroup = await subgroupService.getSubgroupById(req.params.id);
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: "Subgroup not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Subgroup retrieved successfully",
      data: subgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSubgroup = async (req, res) => {
  try {
    const subgroup = await subgroupService.updateSubgroup(req.params.id, req.body);
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: "Subgroup not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Subgroup updated successfully",
      data: subgroup
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteSubgroup = async (req, res) => {
  try {
    const subgroup = await subgroupService.deleteSubgroup(req.params.id);
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: "Subgroup not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Subgroup deleted successfully",
      data: subgroup
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchSubgroups = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const groupId = req.query.groupId || null;
    const subgroups = await subgroupService.searchSubgroups(keyword, groupId);
    res.status(200).json({
      success: true,
      message: "Subgroups retrieved successfully",
      data: subgroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.restoreSubgroup = async (req, res) => {
  try {
    const subgroup = await subgroupService.restoreSubgroup(req.params.id);
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: "Subgroup not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Subgroup restored successfully",
      data: subgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDeletedSubgroups = async (req, res) => {
  try {
    const subgroups = await subgroupService.getDeletedSubgroups();
    res.status(200).json({
      success: true,
      message: "Deleted subgroups retrieved successfully",
      data: subgroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
