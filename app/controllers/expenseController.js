const expenseService = require('../services/expenseService');
const { createResponse } = require('../util/util');

exports.getAllExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const expenseCategory = req.query.expenseCategory || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const vendorId = req.vendor.id;

    const result = await expenseService.getAllExpenses(
      page, 
      limit, 
      keyword, 
      status, 
      vendorId, 
      expenseCategory, 
      startDate, 
      endDate
    );
    
    res.status(200).json(
      createResponse(result, null, "Expenses retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    res.status(200).json(createResponse([], error.message));
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id;

    const expense = await expenseService.getExpenseById(id, vendorId);
    
    if (!expense) {
      return res.status(404).json(createResponse(null, "Expense not found"));
    }

    res.status(200).json(
      createResponse(expense, null, "Expense retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.createExpense = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const expenseData = { ...req.body, vendorId };

    // Validation
    const requiredFields = ['date', 'expenseCategory', 'description', 'amount'];
    const missingFields = requiredFields.filter(field => !expenseData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createResponse(null, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Validate amount
    if (expenseData.amount && (isNaN(expenseData.amount) || parseFloat(expenseData.amount) <= 0)) {
      return res.status(400).json(
        createResponse(null, "Amount must be a valid number greater than 0")
      );
    }

    // Validate date
    if (expenseData.date && isNaN(new Date(expenseData.date))) {
      return res.status(400).json(
        createResponse(null, "Please provide a valid date")
      );
    }

    // Trim string fields
    if (expenseData.description) expenseData.description = expenseData.description.trim();
    if (expenseData.expenseCategory) expenseData.expenseCategory = expenseData.expenseCategory.trim();

    const createdExpense = await expenseService.createExpense(expenseData);
    
    res.status(201).json(createResponse(createdExpense, null, "Expense created successfully"));
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Validation for required fields if they're being updated
    const requiredFields = ['date', 'expenseCategory', 'description', 'amount'];
    for (const field of requiredFields) {
      if (updateData.hasOwnProperty(field) && (!updateData[field] || updateData[field].toString().trim() === '')) {
        return res.status(400).json(
          createResponse(null, `${field} is required and cannot be empty`)
        );
      }
    }

    // Validate amount if being updated
    if (updateData.amount && (isNaN(updateData.amount) || parseFloat(updateData.amount) <= 0)) {
      return res.status(400).json(
        createResponse(null, "Amount must be a valid number greater than 0")
      );
    }

    // Validate date if being updated
    if (updateData.date && isNaN(new Date(updateData.date))) {
      return res.status(400).json(
        createResponse(null, "Please provide a valid date")
      );
    }

    // Trim string fields
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.expenseCategory) updateData.expenseCategory = updateData.expenseCategory.trim();

    const updatedExpense = await expenseService.updateExpense(expenseId, updateData, vendorId);
    
    res.status(200).json(createResponse(updatedExpense, null, "Expense updated successfully"));
  } catch (error) {
    console.error('Update expense error:', error);
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const vendorId = req.vendor.id;

    const result = await expenseService.deleteExpense(expenseId, vendorId);
    
    res.status(200).json(createResponse(result, null, "Expense deleted successfully"));
  } catch (error) {
    console.error('Delete expense error:', error);
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.toggleExpenseStatus = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const vendorId = req.vendor.id;

    const updatedExpense = await expenseService.toggleExpenseStatus(expenseId, vendorId);
    
    const statusMessage = updatedExpense.isActive ? "activated" : "deactivated";
    res.status(200).json(
      createResponse(updatedExpense, null, `Expense ${statusMessage} successfully`)
    );
  } catch (error) {
    console.error('Toggle expense status error:', error);
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json(createResponse(null, error.message));
    }
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getMyExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const vendorId = req.vendor.id;

    const result = await expenseService.getMyExpenses(vendorId, page, limit);
    
    res.status(200).json(
      createResponse(result, null, "My expenses retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getMyExpenses:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpenseStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const stats = await expenseService.getExpenseStats(vendorId);
    
    res.status(200).json(
      createResponse(stats, null, "Expense statistics retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpenseStats:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpensesByCategory = async (req, res) => {
  try {
    const { expenseCategory } = req.params;
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const vendorId = req.vendor.id;

    const result = await expenseService.getExpensesByCategory(vendorId, expenseCategory, page, limit);
    
    res.status(200).json(
      createResponse(result, null, `Expenses for category '${expenseCategory}' retrieved successfully`)
    );
  } catch (error) {
    console.error('Error in getExpensesByCategory:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

exports.getExpensesByDateRange = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const vendorId = req.vendor.id;

    if (!startDate && !endDate) {
      return res.status(400).json(
        createResponse(null, "Please provide at least one date (startDate or endDate)")
      );
    }

    // Validate dates if provided
    if (startDate && isNaN(new Date(startDate))) {
      return res.status(400).json(
        createResponse(null, "Please provide a valid start date")
      );
    }

    if (endDate && isNaN(new Date(endDate))) {
      return res.status(400).json(
        createResponse(null, "Please provide a valid end date")
      );
    }

    const result = await expenseService.getExpensesByDateRange(vendorId, startDate, endDate, page, limit);
    
    res.status(200).json(
      createResponse(result, null, "Expenses by date range retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getExpensesByDateRange:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
