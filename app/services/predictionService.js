const SalesProduct = require('../models/salesProductModel');
const SalesInvoice = require('../models/salesInvoiceModel');
const mongoose = require('mongoose');
const axios = require('axios');

// Python ML Server configuration
const PYTHON_ML_SERVER_URL = process.env.PYTHON_ML_SERVER_URL || 'http://localhost:5000';

/**
 * Sales Prediction Service
 * Groups sales by month, validates data threshold, calls Python ML server via HTTP
 */

class PredictionService {
  /**
   * Get sales prediction for a specific product
   * @param {string} vendorId - Vendor ID
   * @param {string} productId - Product ID
   * @returns {Object} - Chart-ready data with past sales and prediction
   */
  async getProductSalesPrediction(vendorId, productId) {
    // Step 1: Fetch all sales for this product
    const salesData = await SalesProduct.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          productId: new mongoose.Types.ObjectId(productId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'salesinvoices',
          localField: 'salesInvoiceId',
          foreignField: '_id',
          as: 'invoice'
        }
      },
      {
        $unwind: '$invoice'
      },
      {
        $match: {
          'invoice.isActive': true
        }
      },
      {
        $project: {
          date: '$invoice.date',
          quantity: 1,
          productName: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    if (salesData.length === 0) {
      return {
        status: 'no_data',
        message: 'No sales history found for this product'
      };
    }

    // Step 2: Group sales by month (YYYY-MM)
    const monthlyTotals = {};
    
    salesData.forEach(sale => {
      const monthKey = this.getMonthKey(sale.date);
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = 0;
      }
      monthlyTotals[monthKey] += sale.quantity;
    });

    // Get first and last month
    const allMonthKeys = Object.keys(monthlyTotals).sort();
    if (allMonthKeys.length === 0) {
      return {
        status: 'no_data',
        message: 'No sales history found for this product',
        productName: salesData[0].productName
      };
    }

    const firstMonth = allMonthKeys[0];
    const lastMonth = allMonthKeys[allMonthKeys.length - 1];

    // Fill in missing months with zeros to maintain seasonal alignment
    const months = [];
    const totals = [];
    let currentMonth = firstMonth;
    
    while (currentMonth <= lastMonth) {
      months.push(currentMonth);
      totals.push(monthlyTotals[currentMonth] || 0);  // Include 0 for months with no sales
      currentMonth = this.getNextMonth(currentMonth);
    }

    // Step 3: Check threshold (minimum 1 month required for basic prediction)
    if (totals.length < 1) {
      return {
        status: 'no_data',
        message: 'No sales history found for this product',
        productName: salesData[0].productName
      };
    }

    // Step 4: Call Python ML server for prediction
    let prediction;
    try {
      prediction = await this.callPythonMLServer(totals);
    } catch (error) {
      console.error('Python ML server error:', error);
      return {
        status: 'prediction_error',
        message: error.message,
        months: this.formatMonthLabels(months.slice(-12)),
        sales: totals.slice(-12),
        productName: salesData[0].productName
      };
    }

    // Step 5: Prepare chart data (last 12 months + prediction)
    const last12Months = months.slice(-12);
    const last12Totals = totals.slice(-12);

    // Add predicted month
    const nextMonth = this.getNextMonth(last12Months[last12Months.length - 1]);
    
    return {
      status: 'success',
      months: this.formatMonthLabels(last12Months),
      sales: last12Totals,
      predicted: Math.round(prediction.predicted),
      predictedMonth: this.formatMonthLabel(nextMonth),
      productName: salesData[0].productName,
      totalMonthsData: totals.length
    };
  }

  /**
   * Convert date to YYYY-MM format
   */
  getMonthKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get next month key from current month key
   */
  getNextMonth(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    if (month === 12) {
      return `${year + 1}-01`;
    }
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  /**
   * Format month keys to readable labels (e.g., "Jan 2024")
   */
  formatMonthLabels(monthKeys) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthKeys.map(key => this.formatMonthLabel(key));
  }

  formatMonthLabel(key) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month] = key.split('-').map(Number);
    return `${monthNames[month - 1]} ${year}`;
  }

  /**
   * Call Python ML server for prediction
   * @param {Array<number>} monthlyTotals - Array of monthly sales totals
   * @returns {Promise<Object>} - Prediction result
   */
  async callPythonMLServer(monthlyTotals) {
    try {
      const response = await axios.post(
        `${PYTHON_ML_SERVER_URL}/api/ml/predict`,
        {
          monthly_totals: monthlyTotals
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.status === 'success') {
        return {
          predicted: response.data.predicted
        };
      } else {
        throw new Error(response.data.error || 'Prediction failed');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Python ML server is not running. Please start it on port 5000.');
      }
      throw new Error(`ML server error: ${error.message}`);
    }
  }

  /**
   * Get list of products with sales history (for dropdown)
   */
  async getProductsWithSalesHistory(vendorId) {
    const products = await SalesProduct.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'product.brandId',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $unwind: '$brand'
      },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$product.productName' },
          brandName: { $first: '$brand.brandName' },
          totalSales: { $sum: '$quantity' },
          firstSaleDate: { $min: '$invoice.date' },
          lastSaleDate: { $max: '$invoice.date' }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 100
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          brandName: 1,
          totalSales: 1
        }
      }
    ]);

    return products;
  }
}

module.exports = new PredictionService();
