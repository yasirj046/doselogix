const groupService = require("../services/groupService");

exports.createGroup = async (req, res) => {
  try {
    const group = await groupService.createGroup(req.body);
    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await groupService.getAllGroups();
    res.status(200).json({
      success: true,
      message: "Groups retrieved successfully",
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await groupService.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Group retrieved successfully",
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await groupService.updateGroup(req.params.id, req.body);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await groupService.deleteGroup(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchGroups = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const groups = await groupService.searchGroups(keyword);
    res.status(200).json({
      success: true,
      message: "Groups retrieved successfully",
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.restoreGroup = async (req, res) => {
  try {
    const group = await groupService.restoreGroup(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Group restored successfully",
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDeletedGroups = async (req, res) => {
  try {
    const groups = await groupService.getDeletedGroups();
    res.status(200).json({
      success: true,
      message: "Deleted groups retrieved successfully",
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
