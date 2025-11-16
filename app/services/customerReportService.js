const SalesInvoice = require('../models/salesInvoiceModel')
const UserCustomers = require('../models/userCustomersModel')

/**
 * Get customer report with all sales invoices and aggregated statistics
 * @param {String} vendorId
 * @param {String} customerId
 * @param {Object} options
 */
exports.getCustomerReport = async (vendorId, customerId, options = {}) => {
  try {
    if (!vendorId || !customerId) throw new Error('Vendor ID and Customer ID are required')

    const {
      startDate,
      endDate,
      paymentStatus,
      pageNumber = 1,
      pageSize = 10,
      keyword = ''
    } = options

    const customer = await UserCustomers.findOne({ _id: customerId, vendorId, isActive: true })
    if (!customer) throw new Error('Customer not found or not active')

    const query = { vendorId, customerId, isActive: true }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        query.date = { $gte: start, $lte: end }
      }
    } else if (startDate) {
      const start = new Date(startDate)
      if (!isNaN(start.getTime())) query.date = { $gte: start }
    } else if (endDate) {
      const end = new Date(endDate)
      if (!isNaN(end.getTime())) query.date = { $lte: end }
    }

    if (keyword && keyword !== '') {
      query.$or = [
        { salesInvoiceNumber: { $regex: keyword, $options: 'i' } },
        { remarks: { $regex: keyword, $options: 'i' } }
      ]
    }

    const allInvoices = await SalesInvoice.find(query).lean()

    let filteredInvoices = allInvoices
    if (paymentStatus) {
      filteredInvoices = allInvoices.filter(invoice => {
        const status = determinePaymentStatus(invoice)
        return status.toLowerCase() === paymentStatus.toLowerCase()
      })
    }

    const statistics = calculateCustomerStatistics(filteredInvoices)

    const totalDocs = filteredInvoices.length
    const skip = (pageNumber - 1) * pageSize
    const paginatedInvoices = filteredInvoices.slice(skip, skip + pageSize)

    const salesInvoicesData = await SalesInvoice.find({ _id: { $in: paginatedInvoices.map(i => i._id) } })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('customerId', 'customerName customerAddress customerPrimaryContact')
      .populate('deliverBy', 'employeeName designation')
      .populate('bookedBy', 'employeeName designation')
      .sort({ date: -1 })
      .lean()

    return {
      customer: {
        _id: customer._id,
        customerName: customer.customerName,
        customerAddress: customer.customerAddress,
        customerPrimaryContact: customer.customerPrimaryContact,
        customerSecondaryContact: customer.customerSecondaryContact,
        customerCategory: customer.customerCategory,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      },
      dateRange: { startDate: startDate || null, endDate: endDate || null },
      statistics,
      docs: salesInvoicesData.map(invoice => ({
        _id: invoice._id,
        salesInvoiceNumber: invoice.salesInvoiceNumber,
        date: invoice.date,
        licenseNumber: invoice.licenseNumber,
        licenseExpiry: invoice.licenseExpiry,
        lastInvoiceBalance: invoice.lastInvoiceBalance,
        subtotal: invoice.subtotal,
        totalDiscount: invoice.totalDiscount,
        grandTotal: invoice.grandTotal,
        cash: invoice.cash,
        credit: invoice.credit,
        paymentDetails: invoice.paymentDetails,
        totalPaid: calculateTotalPaid(invoice),
        remainingBalance: invoice.grandTotal - calculateTotalPaid(invoice),
        paymentStatus: determinePaymentStatus(invoice),
        remarks: invoice.remarks,
        deliverBy: invoice.deliverBy,
        bookedBy: invoice.bookedBy,
        deliveryLogNumber: invoice.deliveryLogNumber,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      })),
      salesInvoices: salesInvoicesData.map(invoice => ({
        _id: invoice._id,
        salesInvoiceNumber: invoice.salesInvoiceNumber,
        date: invoice.date,
        licenseNumber: invoice.licenseNumber,
        licenseExpiry: invoice.licenseExpiry,
        lastInvoiceBalance: invoice.lastInvoiceBalance,
        subtotal: invoice.subtotal,
        totalDiscount: invoice.totalDiscount,
        grandTotal: invoice.grandTotal,
        cash: invoice.cash,
        credit: invoice.credit,
        paymentDetails: invoice.paymentDetails,
        totalPaid: calculateTotalPaid(invoice),
        remainingBalance: invoice.grandTotal - calculateTotalPaid(invoice),
        paymentStatus: determinePaymentStatus(invoice),
        remarks: invoice.remarks,
        deliverBy: invoice.deliverBy,
        bookedBy: invoice.bookedBy,
        deliveryLogNumber: invoice.deliveryLogNumber,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      })),
      // pagination
      totalDocs,
      limit: pageSize,
      page: pageNumber,
      totalPages: Math.ceil(totalDocs / pageSize),
      pagingCounter: skip + 1,
      hasPrevPage: pageNumber > 1,
      hasNextPage: pageNumber < Math.ceil(totalDocs / pageSize),
      prevPage: pageNumber > 1 ? pageNumber - 1 : null,
      nextPage: pageNumber < Math.ceil(totalDocs / pageSize) ? pageNumber + 1 : null
    }
  } catch (error) {
    console.error('Error in getCustomerReport:', error)
    throw error
  }
}

/**
 * Get customers report summary (all customers with their statistics)
 */
exports.getCustomersReportSummary = async (vendorId, options = {}) => {
  try {
    if (!vendorId) throw new Error('Vendor ID is required')
    const { customerId, startDate, endDate, paymentStatus, pageNumber = 1, pageSize = 10 } = options

    const customerQuery = { vendorId, isActive: true }
    if (customerId) customerQuery._id = customerId
    const customers = await UserCustomers.find(customerQuery).sort({ customerName: 1 })

    const dateQuery = {}
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        dateQuery.date = { $gte: start, $lte: end }
      }
    } else if (startDate) {
      const start = new Date(startDate)
      if (!isNaN(start.getTime())) dateQuery.date = { $gte: start }
    } else if (endDate) {
      const end = new Date(endDate)
      if (!isNaN(end.getTime())) dateQuery.date = { $lte: end }
    }

    const customerReportsPromises = customers.map(async (customer) => {
      const query = { vendorId, customerId: customer._id, isActive: true, ...dateQuery }
      const salesInvoices = await SalesInvoice.find(query).lean()

      let filteredInvoices = salesInvoices
      if (paymentStatus) {
        filteredInvoices = salesInvoices.filter(invoice => {
          const status = determinePaymentStatus(invoice)
          return status.toLowerCase() === paymentStatus.toLowerCase()
        })
      }

      const statistics = calculateCustomerStatistics(filteredInvoices)

      return {
        customerId: customer._id,
        customerName: customer.customerName,
        totalInvoices: statistics.totalInvoices,
        grossSalesAmount: statistics.grossSales,
        totalDiscount: statistics.totalDiscount,
        grandTotal: statistics.grandTotal,
        totalPaid: statistics.totalPaid,
        outstandingReceivable: statistics.outstandingAmount
      }
    })

    const allCustomerReports = await Promise.all(customerReportsPromises)
    const filteredReports = allCustomerReports.filter(report => report.totalInvoices > 0)

    const totalDocs = filteredReports.length
    const skip = (pageNumber - 1) * pageSize
    const paginatedReports = filteredReports.slice(skip, skip + pageSize)

    return {
      docs: paginatedReports,
      totalDocs,
      limit: pageSize,
      page: pageNumber,
      totalPages: Math.ceil(totalDocs / pageSize),
      pagingCounter: skip + 1,
      hasPrevPage: pageNumber > 1,
      hasNextPage: pageNumber < Math.ceil(totalDocs / pageSize),
      prevPage: pageNumber > 1 ? pageNumber - 1 : null,
      nextPage: pageNumber < Math.ceil(totalDocs / pageSize) ? pageNumber + 1 : null
    }
  } catch (error) {
    console.error('Error in getCustomersReportSummary:', error)
    throw error
  }
}

function calculateCustomerStatistics(salesInvoices) {
  const statistics = {
    totalInvoices: salesInvoices.length,
    grossSales: 0,
    totalDiscount: 0,
    grandTotal: 0,
    totalPaid: 0,
    outstandingAmount: 0
  }

  salesInvoices.forEach(invoice => {
    statistics.grossSales += invoice.subtotal || 0
    statistics.totalDiscount += invoice.totalDiscount || 0
    statistics.grandTotal += invoice.grandTotal || 0

    const paid = calculateTotalPaid(invoice)
    statistics.totalPaid += paid
    statistics.outstandingAmount += (invoice.grandTotal || 0) - paid
  })

  return statistics
}

function calculateTotalPaid(invoice) {
  if (!invoice) return 0
  const cash = invoice.cash || 0
  const paymentDetailsTotal = invoice.paymentDetails && Array.isArray(invoice.paymentDetails)
    ? invoice.paymentDetails.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
    : 0
  return cash + paymentDetailsTotal
}

function determinePaymentStatus(invoice) {
  const totalPaid = calculateTotalPaid(invoice)
  const grandTotal = invoice.grandTotal || 0

  if (totalPaid >= grandTotal) return 'Paid'
  if (totalPaid > 0) return 'Partial'
  return 'Unpaid'
}

module.exports = exports
