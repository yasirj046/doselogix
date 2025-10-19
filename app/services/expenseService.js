const Expense = require('../models/expenseModel');

exports.getAllExpenses = async (page, limit, keyword, status, vendorId, expenseCategory, startDate, endDate) => {
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
    
    // Filter by expense category if provided
    if (expenseCategory && expenseCategory !== "") {
      query.expenseCategory = expenseCategory;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Search by keyword in description and category
    if (keyword && keyword !== "") {
      query.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { expenseCategory: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await Expense.paginate(query, { 
      page, 
      limit,
      sort: { date: -1, createdAt: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    throw error;
  }
};

exports.getExpenseById = async (id, vendorId) => {
  try {
    const expense = await Expense.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail');
      
    if (!expense) {
      throw new Error('Expense not found');
    }
    return expense;
  } catch (error) {
    throw error;
  }
};

exports.createExpense = async (expenseData) => {
  try {
    const expense = new Expense(expenseData);
    const savedExpense = await expense.save();
    return await Expense.findById(savedExpense._id)
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    throw error;
  }
};

exports.updateExpense = async (expenseId, updateData, vendorId) => {
  try {
    // Remove fields that shouldn't be updated directly
    delete updateData.vendorId;
    delete updateData.createdAt;
    
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: expenseId, vendorId },
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('vendorId', 'vendorName vendorEmail');
    
    if (!updatedExpense) {
      throw new Error('Expense not found or you do not have permission to update it');
    }
    
    return updatedExpense;
  } catch (error) {
    throw error;
  }
};

exports.deleteExpense = async (expenseId, vendorId) => {
  try {
    const expense = await Expense.findOne({ _id: expenseId, vendorId });
    
    if (!expense) {
      throw new Error('Expense not found or you do not have permission to delete it');
    }
    
    await Expense.findByIdAndDelete(expenseId);
    return { message: 'Expense deleted successfully' };
  } catch (error) {
    throw error;
  }
};

exports.toggleExpenseStatus = async (expenseId, vendorId) => {
  try {
    const expense = await Expense.findOne({ _id: expenseId, vendorId });
    
    if (!expense) {
      throw new Error('Expense not found or you do not have permission to update it');
    }
    
    expense.isActive = !expense.isActive;
    await expense.save();
    
    return await Expense.findById(expenseId)
      .populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    throw error;
  }
};

exports.getMyExpenses = async (vendorId, page, limit) => {
  try {
    return await Expense.paginate(
      { vendorId, isActive: true }, 
      { 
        page, 
        limit,
        sort: { date: -1, createdAt: -1 },
        populate: [
          {
            path: 'vendorId',
            select: 'vendorName vendorEmail'
          }
        ]
      }
    );
  } catch (error) {
    throw error;
  }
};

exports.getExpenseStats = async (vendorId) => {
  try {
    const totalExpenses = await Expense.countDocuments({ vendorId, isActive: true });
    const totalAmount = await Expense.getTotalExpensesByVendor(vendorId);
    
    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: { vendorId: vendorId, isActive: true } },
      { 
        $group: { 
          _id: '$expenseCategory', 
          count: { $sum: 1 }, 
          totalAmount: { $sum: '$amount' }
        } 
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Get monthly expenses for current year
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = await Expense.aggregate([
      { 
        $match: { 
          vendorId: vendorId, 
          isActive: true,
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        } 
      },
      { 
        $group: { 
          _id: { $month: '$date' }, 
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    return {
      totalExpenses,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      expensesByCategory,
      monthlyExpenses
    };
  } catch (error) {
    throw error;
  }
};

exports.getExpensesByCategory = async (vendorId, expenseCategory, page, limit) => {
  try {
    return await Expense.paginate(
      { vendorId, expenseCategory, isActive: true }, 
      { 
        page, 
        limit,
        sort: { date: -1, createdAt: -1 },
        populate: [
          {
            path: 'vendorId',
            select: 'vendorName vendorEmail'
          }
        ]
      }
    );
  } catch (error) {
    throw error;
  }
};

exports.getExpensesByDateRange = async (vendorId, startDate, endDate, page, limit) => {
  try {
    const query = { vendorId, isActive: true };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    return await Expense.paginate(query, { 
      page, 
      limit,
      sort: { date: -1, createdAt: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        }
      ]
    });
  } catch (error) {
    throw error;
  }
};

exports.getExpenseCategories = () => {
  return Expense.getExpenseCategories();
};
