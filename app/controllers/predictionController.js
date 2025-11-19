const SalesProduct = require('../models/salesProductModel');
const SalesInvoice = require('../models/salesInvoiceModel');
const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const mongoose = require('mongoose');
const axios = require('axios');

/**
 * Prediction Controller
 * Handles sales prediction requests by aggregating historical data
 * and communicating with Python ML service
 */

/**
 * Helper function to fill missing months with zero values
 * Creates a continuous time series from first sale to current month
 */
function fillMissingMonths(salesData, startDate) {
  if (!salesData || salesData.length === 0) {
    return [];
  }

  // Find the earliest month in the data
  const firstSale = salesData[0];
  const lastSale = salesData[salesData.length - 1];
  
  // Create a map of existing data for quick lookup
  const salesMap = new Map();
  salesData.forEach(item => {
    salesMap.set(item.yearMonth, item);
  });

  // Generate all months from first sale to last sale
  const filledData = [];
  const currentDate = new Date(firstSale.year, firstSale.month - 1, 1);
  const endDate = new Date(lastSale.year, lastSale.month - 1, 1);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;

    if (salesMap.has(yearMonth)) {
      // Use existing data
      filledData.push(salesMap.get(yearMonth));
    } else {
      // Fill with zero
      filledData.push({
        year: year,
        month: month,
        yearMonth: yearMonth,
        quantity: 0,
        amount: 0
      });
    }

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return filledData;
}

// Python server configuration
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';
const PREDICTION_ENDPOINT = `${PYTHON_API_URL}/api/predict-sales`;

// Constants
const MIN_MONTHS = 6;
const MAX_MONTHS = 36;

/**
 * Get list of products that have sales history
 * Only returns products with at least MIN_MONTHS of sales data
 */
exports.getProductsWithSalesHistory = async (req, res) => {
  try {
    // vendor context is attached by multiTenancy middleware as req.vendor.id
    if (!req.vendor || !req.vendor.id) {
      return res.status(401).json({ success: false, message: 'Vendor context missing. Please authenticate.' });
    }

    const vendorId = req.vendor.id;

    // Find all products with sales in the last 36 months
    const thirtySixMonthsAgo = new Date();
    thirtySixMonthsAgo.setMonth(thirtySixMonthsAgo.getMonth() - MAX_MONTHS);

    const productsWithSales = await SalesProduct.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
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
          'invoice.isActive': true,
          'invoice.date': { $gte: thirtySixMonthsAgo }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalQuantity: { $sum: '$quantity' },
          monthCount: { $addToSet: { 
            $dateToString: { format: '%Y-%m', date: '$invoice.date' }
          }}
        }
      },
      // Removed MIN_MONTHS filter - show all products with any sales history
      // The prediction endpoint will handle the "not enough data" case gracefully
      {
        $lookup: {
          from: 'products',
          localField: '_id',
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
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.productName',
          brandName: '$brand.brandName',
          totalSales: '$totalQuantity',  // Frontend expects 'totalSales'
          monthsWithSales: { $size: '$monthCount' }
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Products with sales history retrieved successfully',
      data: productsWithSales
    });

  } catch (error) {
    console.error('Error fetching products with sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products with sales history',
      error: error.message
    });
  }
};

/**
 * Get sales prediction for a specific product
 * Aggregates monthly sales data and calls Python ML service
 */
exports.getProductSalesPrediction = async (req, res) => {
  try {
    // vendor context is attached by multiTenancy middleware as req.vendor.id
    if (!req.vendor || !req.vendor.id) {
      return res.status(401).json({ success: false, message: 'Vendor context missing. Please authenticate.' });
    }
    const vendorId = req.vendor.id;
    const { productId } = req.query;

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Product ID format'
      });
    }

    // Get product and brand details
    const product = await Product.findOne({
      _id: productId,
      vendorId,
      isActive: true
    }).populate('brandId');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Aggregate monthly sales data for the last 36 months
    const thirtySixMonthsAgo = new Date();
    thirtySixMonthsAgo.setMonth(thirtySixMonthsAgo.getMonth() - MAX_MONTHS);

    const monthlySalesData = await SalesProduct.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          vendorId: new mongoose.Types.ObjectId(vendorId),
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
          'invoice.isActive': true,
          'invoice.date': { $gte: thirtySixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$invoice.date' },
            month: { $month: '$invoice.date' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          yearMonth: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          quantity: '$totalQuantity',
          amount: '$totalAmount'
        }
      }
    ]);

    // Fill in missing months with zero values to create continuous time series
    const filledMonthlySalesData = fillMissingMonths(monthlySalesData, thirtySixMonthsAgo);

    // Validate data availability - check if we have at least MIN_MONTHS of data range
    // (even if some months have 0 sales)
    if (filledMonthlySalesData.length < MIN_MONTHS) {
      // Return 'not_enough_data' status with available data
      return res.status(200).json({
        success: true,
        data: {
          status: 'not_enough_data',
          productName: product.productName,
          brandName: product.brandId.brandName,
          message: `At least ${MIN_MONTHS} months of sales history required. Found ${filledMonthlySalesData.length} months.`,
          months: filledMonthlySalesData.map(item => item.yearMonth),
          sales: filledMonthlySalesData.map(item => item.quantity),
          totalMonthsData: filledMonthlySalesData.length
        }
      });
    }

    // Limit to MAX_MONTHS if we have more data (take the most recent months)
    const salesDataForPrediction = filledMonthlySalesData.slice(-MAX_MONTHS);

    // Extract monthly quantities for the ML model
    const monthlySales = salesDataForPrediction.map(item => item.quantity);

    // Prepare request for Python API
    const predictionRequest = {
      productId: productId,
      productName: product.productName,
      brandName: product.brandId.brandName,
      monthlySales: monthlySales
    };

    console.log('Sending prediction request to Python API:', {
      productName: product.productName,
      monthsOfData: monthlySales.length,
      endpoint: PREDICTION_ENDPOINT
    });

    // Call Python ML service
    let predictionResponse;
    try {
      predictionResponse = await axios.post(PREDICTION_ENDPOINT, predictionRequest, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (axiosError) {
      console.error('Python API Error:', axiosError.message);
      
      // Handle specific error cases
      // Show only last 12 months for display even in error cases
      const displayData = salesDataForPrediction.slice(-12);
      
      if (axiosError.code === 'ECONNREFUSED') {
        return res.status(200).json({
          success: true,
          data: {
            status: 'prediction_error',
            productName: product.productName,
            brandName: product.brandId.brandName,
            message: 'ML prediction service is unavailable. Please ensure Python server is running.',
            months: displayData.map(item => item.yearMonth),
            sales: displayData.map(item => item.quantity),
            totalMonthsData: salesDataForPrediction.length
          }
        });
      }

      if (axiosError.response) {
        // Python API returned an error response
        return res.status(200).json({
          success: true,
          data: {
            status: 'prediction_error',
            productName: product.productName,
            brandName: product.brandId.brandName,
            message: axiosError.response.data.error || axiosError.response.data.detail || 'Prediction failed',
            months: displayData.map(item => item.yearMonth),
            sales: displayData.map(item => item.quantity),
            totalMonthsData: salesDataForPrediction.length
          }
        });
      }

      throw axiosError;
    }

    const prediction = predictionResponse.data;

    // Calculate next month for display
    const lastMonth = salesDataForPrediction[salesDataForPrediction.length - 1];
    const lastDate = new Date(lastMonth.year, lastMonth.month - 1);
    lastDate.setMonth(lastDate.getMonth() + 1);
    const predictedMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;

    // For display: show only last 12 months (for the chart bars)
    // But we used all available data (6-36 months) for the ML prediction
    const displayData = salesDataForPrediction.slice(-12);

    // Prepare response in the format frontend expects
    const response = {
      success: true,
      data: {
        status: 'success',
        productName: product.productName,
        brandName: product.brandId.brandName,
        months: displayData.map(item => item.yearMonth),
        sales: displayData.map(item => item.quantity),
        predicted: Math.round(prediction.predictedNextMonth),
        predictedMonth: predictedMonth,
        totalMonthsData: salesDataForPrediction.length, // Total months used for prediction
        confidence: prediction.confidence
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating sales prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales prediction',
      error: error.message
    });
  }
};
