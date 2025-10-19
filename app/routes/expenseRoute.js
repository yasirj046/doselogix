const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/authMiddleware');
const { multiTenancy } = require('../middleware/multiTenancyMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new expense
router.post('/', multiTenancy, expenseController.createExpense);

// Get all expenses with pagination and filtering
router.get('/', multiTenancy, expenseController.getAllExpenses);

// Get my expenses (vendor-specific)
router.get('/my/expenses', multiTenancy, expenseController.getMyExpenses);

// Get expense statistics
router.get('/stats', multiTenancy, expenseController.getExpenseStats);

// Get expenses by category
router.get('/category/:expenseCategory', multiTenancy, expenseController.getExpensesByCategory);

// Get expenses by date range
router.get('/date-range', multiTenancy, expenseController.getExpensesByDateRange);

// Get a single expense by ID
router.get('/:id', multiTenancy, expenseController.getExpenseById);

// Update an expense
router.put('/:id', multiTenancy, expenseController.updateExpense);

// Toggle expense active status
router.patch('/:id/toggle-status', multiTenancy, expenseController.toggleExpenseStatus);

// Delete an expense
router.delete('/:id', multiTenancy, expenseController.deleteExpense);

module.exports = router;
