const SalesInvoice = require('../models/salesInvoiceModel');
const SalesProduct = require('../models/salesProductModel');
const Inventory = require('../models/inventoryModel');
const LedgerTransaction = require('../models/ledgerTransactionModel');
const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const Area = require('../models/areaModel');
const UserCustomers = require('../models/userCustomersModel');
const mongoose = require('mongoose');

/**
 * Dashboard Service Layer
 * Separates business logic from controllers
 * Handles all data aggregation for dashboard widgets
 */

class DashboardService {
  /**
   * Get summary cards data
   */
  async getSummaryCards(vendorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Total Sales Today & Invoice Count Today
    const todaySalesAgg = await SalesInvoice.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          date: { $gte: today, $lt: tomorrow },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          invoiceCount: { $sum: 1 }
        }
      }
    ]);

    const todaySalesData = todaySalesAgg[0] || { totalSales: 0, invoiceCount: 0 };

    // 2. Pending Receivables (Grand Total - Total Paid from all invoices)
    const receivablesAgg = await SalesInvoice.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isActive: true
        }
      },
      {
        $addFields: {
          totalPaidFromPayments: {
            $sum: {
              $map: {
                input: { $ifNull: ['$paymentDetails', []] },
                as: 'payment',
                in: '$$payment.amountPaid'
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalPaid: { $add: [{ $ifNull: ['$cash', 0] }, '$totalPaidFromPayments'] },
          creditAmount: { $subtract: ['$grandTotal', { $add: [{ $ifNull: ['$cash', 0] }, '$totalPaidFromPayments'] }] }
        }
      },
      {
        $match: {
          creditAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalReceivables: { $sum: '$creditAmount' }
        }
      }
    ]);

    const receivablesData = receivablesAgg[0] || { totalReceivables: 0 };

    // 3. Top Selling Brand Today
    const topBrandAgg = await SalesProduct.aggregate([
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
          vendorId: new mongoose.Types.ObjectId(vendorId),
          'invoice.date': { $gte: today, $lt: tomorrow },
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
          _id: '$brand._id',
          brandName: { $first: '$brand.brandName' },
          totalSales: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 1
      }
    ]);

    const topBrand = topBrandAgg[0] || { brandName: 'N/A', totalSales: 0 };

    return {
      totalSalesToday: todaySalesData.totalSales,
      invoicesGeneratedToday: todaySalesData.invoiceCount,
      pendingReceivables: receivablesData.totalReceivables,
      topSellingBrand: {
        name: topBrand.brandName,
        sales: topBrand.totalSales
      }
    };
  }

  /**
   * Get brand-wise sales data
   */
  async getBrandWiseSales(vendorId, startDate, endDate, limit = 10) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter['invoice.date'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const brandSalesAgg = await SalesProduct.aggregate([
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
          ...dateFilter
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
          _id: '$brand._id',
          brandName: { $first: '$brand.brandName' },
          totalSales: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          brandId: '$_id',
          brandName: 1,
          totalSales: { $round: ['$totalSales', 2] },
          totalQuantity: 1
        }
      }
    ]);

    return brandSalesAgg;
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(vendorId, startDate, endDate, limit = 5) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter['invoice.date'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total sales for contribution calculation
    const totalSalesAgg = await SalesProduct.aggregate([
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
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = totalSalesAgg[0]?.totalRevenue || 1;

    // Get top products
    const topProductsAgg = await SalesProduct.aggregate([
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
          ...dateFilter
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
          totalQuantitySold: { $sum: '$quantity' },
          totalSalesValue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { totalSalesValue: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          brandName: 1,
          totalQuantitySold: 1,
          totalRevenue: { $round: ['$totalSalesValue', 2] },
          contributionPercentage: {
            $round: [
              { $multiply: [{ $divide: ['$totalSalesValue', totalRevenue] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    return {
      products: topProductsAgg,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };
  }

  /**
   * Get receivables aging analysis
   * Returns detailed list of each invoice with outstanding credit and its age
   */
  async getReceivablesAging(vendorId) {
    const today = new Date();

    // Get all sales invoices with outstanding credit
    const invoicesWithCredit = await SalesInvoice.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'usercustomers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $addFields: {
          totalPaidFromPayments: {
            $sum: {
              $map: {
                input: { $ifNull: ['$paymentDetails', []] },
                as: 'payment',
                in: '$$payment.amountPaid'
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalPaid: { $add: [{ $ifNull: ['$cash', 0] }, '$totalPaidFromPayments'] },
          creditedAmount: { 
            $subtract: ['$grandTotal', { $add: [{ $ifNull: ['$cash', 0] }, '$totalPaidFromPayments'] }] 
          }
        }
      },
      {
        $match: {
          creditedAmount: { $gt: 0 } // Only invoices with outstanding credit
        }
      },
      {
        $addFields: {
          creditAge: {
            $floor: {
              $divide: [
                { $subtract: [today, '$date'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          invoiceNumber: '$salesInvoiceNumber',
          customerName: '$customer.customerName',
          creditedAmount: { $round: ['$creditedAmount', 2] },
          creditAge: 1,
          invoiceDate: '$date',
          grandTotal: 1,
          totalPaid: { $round: ['$totalPaid', 2] }
        }
      },
      {
        $sort: { creditAge: -1 } // Sort by age, oldest first
      }
    ]);

    // Calculate total receivables
    const totalReceivables = invoicesWithCredit.reduce((sum, inv) => sum + inv.creditedAmount, 0);

    return {
      invoices: invoicesWithCredit,
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      count: invoicesWithCredit.length
    };
  }

  /**
   * Get stock alerts - grouped by product (sum of all batches)
   */
  async getStockAlerts(vendorId, limit = 20) {
    const stockAlertsAgg = await Inventory.aggregate([
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
          localField: 'brandId',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $unwind: '$brand'
      },
      {
        $group: {
          _id: {
            productId: '$productId',
            brandId: '$brandId'
          },
          productName: { $first: '$product.productName' },
          brandName: { $first: '$brand.brandName' },
          totalStock: { $sum: '$currentQuantity' },
          batchCount: { $sum: 1 }
        }
      },
      {
        $match: {
          totalStock: { $lt: 50 }
        }
      },
      {
        $addFields: {
          alertType: {
            $switch: {
              branches: [
                { case: { $eq: ['$totalStock', 0] }, then: 'Critical' },
                { case: { $lte: ['$totalStock', 10] }, then: 'Critical' },
                { case: { $lte: ['$totalStock', 25] }, then: 'Warning' },
                { case: { $lte: ['$totalStock', 50] }, then: 'Low' }
              ],
              default: 'Low'
            }
          }
        }
      },
      {
        $sort: { totalStock: 1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          productName: 1,
          brandName: 1,
          currentStock: '$totalStock',
          batchCount: 1,
          alertType: 1
        }
      }
    ]);

    return stockAlertsAgg;
  }

  /**
   * Get near-expiry products
   */
  async getNearExpiryProducts(vendorId, limit = 20) {
    const today = new Date();
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const nearExpiryAgg = await Inventory.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isActive: true,
          expiryDate: { $lte: sixMonthsFromNow },
          currentQuantity: { $gt: 0 }
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
          localField: 'brandId',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $unwind: '$brand'
      },
      {
        $addFields: {
          daysToExpiry: {
            $floor: {
              $divide: [
                { $subtract: ['$expiryDate', today] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $addFields: {
          urgencyLevel: {
            $switch: {
              branches: [
                { case: { $lt: ['$daysToExpiry', 0] }, then: 'expired' },
                { case: { $lte: ['$daysToExpiry', 90] }, then: 'critical' },
                { case: { $lte: ['$daysToExpiry', 180] }, then: 'warning' }
              ],
              default: 'normal'
            }
          }
        }
      },
      {
        $sort: { daysToExpiry: 1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          inventoryId: '$_id',
          productName: '$product.productName',
          brandName: '$brand.brandName',
          batchNumber: 1,
          expiryDate: 1,
          quantity: '$currentQuantity',
          daysToExpiry: 1,
          urgencyLevel: 1
        }
      }
    ]);

    return nearExpiryAgg;
  }

  /**
   * Get area-wise sales
   */
  async getAreaWiseSales(vendorId, startDate, endDate, limit = 10) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const areaWiseSalesAgg = await SalesInvoice.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isActive: true,
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'usercustomers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $lookup: {
          from: 'areas',
          localField: 'customer.customerArea',
          foreignField: '_id',
          as: 'area'
        }
      },
      {
        $unwind: '$area'
      },
      {
        $group: {
          _id: '$area._id',
          areaName: { $first: '$area.area' },
          totalSales: { $sum: '$grandTotal' },
          totalInvoices: { $sum: 1 }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          areaId: '$_id',
          areaName: 1,
          totalSales: { $round: ['$totalSales', 2] },
          totalInvoices: 1
        }
      }
    ]);

    return areaWiseSalesAgg;
  }

  /**
   * Get invoice breakdown (cash vs credit)
   */
  async getInvoiceBreakdown(vendorId, startDate, endDate) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const breakdownAgg = await SalesInvoice.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isActive: true,
          ...dateFilter
        }
      },
      {
        $addFields: {
          totalPaidFromPayments: {
            $sum: {
              $map: {
                input: { $ifNull: ['$paymentDetails', []] },
                as: 'payment',
                in: '$$payment.amountPaid'
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalCash: { $add: [{ $ifNull: ['$cash', 0] }, '$totalPaidFromPayments'] },
          totalCredit: { $subtract: ['$grandTotal', { $add: [{ $ifNull: ['$cash', 0] }, '$totalPaidFromPayments'] }] }
        }
      },
      {
        $group: {
          _id: null,
          cashAmount: { $sum: '$totalCash' },
          creditAmount: { $sum: '$totalCredit' },
          totalSales: { $sum: '$grandTotal' }
        }
      }
    ]);

    const breakdown = breakdownAgg[0] || { cashAmount: 0, creditAmount: 0, totalSales: 0 };

    const cashPercentage = breakdown.totalSales > 0
      ? Math.round((breakdown.cashAmount / breakdown.totalSales) * 100 * 100) / 100
      : 0;
    
    const creditPercentage = breakdown.totalSales > 0
      ? Math.round((breakdown.creditAmount / breakdown.totalSales) * 100 * 100) / 100
      : 0;

    return {
      cash: {
        amount: Math.round(breakdown.cashAmount * 100) / 100,
        percentage: cashPercentage
      },
      credit: {
        amount: Math.round(breakdown.creditAmount * 100) / 100,
        percentage: creditPercentage
      },
      total: Math.round(breakdown.totalSales * 100) / 100
    };
  }

  /**
   * Get complete dashboard (all widgets)
   */
  async getCompleteDashboard(vendorId, startDate, endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultStartDate = startDate || today.toISOString();
    const defaultEndDate = endDate || tomorrow.toISOString();

    // Execute all queries in parallel
    const [
      summaryCards,
      brandWiseSales,
      topProducts,
      receivablesAging,
      stockAlerts,
      nearExpiry,
      areaWiseSales,
      invoiceBreakdown
    ] = await Promise.all([
      this.getSummaryCards(vendorId),
      this.getBrandWiseSales(vendorId, defaultStartDate, defaultEndDate, 10),
      this.getTopSellingProducts(vendorId, defaultStartDate, defaultEndDate, 5),
      this.getReceivablesAging(vendorId),
      this.getStockAlerts(vendorId, 20),
      this.getNearExpiryProducts(vendorId, 20),
      this.getAreaWiseSales(vendorId, defaultStartDate, defaultEndDate, 10),
      this.getInvoiceBreakdown(vendorId, defaultStartDate, defaultEndDate)
    ]);

    return {
      summaryCards,
      brandWiseSales,
      topProducts: topProducts.products,
      receivablesAging: receivablesAging.aging,
      stockAlerts,
      nearExpiry,
      areaWiseSales,
      invoiceBreakdown,
      meta: {
        totalRevenue: topProducts.totalRevenue,
        totalReceivables: receivablesAging.totalReceivables,
        dateRange: {
          startDate: defaultStartDate,
          endDate: defaultEndDate
        },
        generatedAt: new Date().toISOString()
      }
    };
  }
}

module.exports = new DashboardService();
