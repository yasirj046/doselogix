const PurchaseEntry = require('../models/purchaseEntryModel')
const Brand = require('../models/brandModel')

/**
 * Get brand report with all purchase entries and aggregated statistics
 * @param {String} vendorId
 * @param {String} brandId
 * @param {Object} options
 */
exports.getBrandReport = async (vendorId, brandId, options = {}) => {
  try {
    if (!vendorId || !brandId) throw new Error('Vendor ID and Brand ID are required')

    const {
      startDate,
      endDate,
      paymentStatus,
      pageNumber = 1,
      pageSize = 10,
      keyword = ''
    } = options

    const brand = await Brand.findOne({ _id: brandId, vendorId, isActive: true })
    if (!brand) throw new Error('Brand not found or not active')

    const query = { vendorId, brandId, isActive: true }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        query.invoiceDate = { $gte: start, $lte: end }
      }
    } else if (startDate) {
      const start = new Date(startDate)
      if (!isNaN(start.getTime())) query.invoiceDate = { $gte: start }
    } else if (endDate) {
      const end = new Date(endDate)
      if (!isNaN(end.getTime())) query.invoiceDate = { $lte: end }
    }

    if (keyword && keyword !== '') {
      query.$or = [
        { invoiceNumber: { $regex: keyword, $options: 'i' } },
        { remarks: { $regex: keyword, $options: 'i' } }
      ]
    }

    const allEntries = await PurchaseEntry.find(query).lean()

    let filteredEntries = allEntries
    if (paymentStatus) {
      filteredEntries = allEntries.filter(entry => {
        const status = determinePaymentStatus(entry)
        return status.toLowerCase() === paymentStatus.toLowerCase()
      })
    }

    const statistics = calculateBrandStatistics(filteredEntries)

    const totalDocs = filteredEntries.length
    const skip = (pageNumber - 1) * pageSize
    const paginatedEntries = filteredEntries.slice(skip, skip + pageSize)

    const purchaseEntriesData = await PurchaseEntry.find({ _id: { $in: paginatedEntries.map(e => e._id) } })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('brandId', 'brandName')
      .sort({ invoiceDate: -1 })
      .lean()

    return {
      brand: {
        _id: brand._id,
        brandName: brand.brandName,
        address: brand.address,
        primaryContact: brand.primaryContact,
        secondaryContact: brand.secondaryContact,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt
      },
      dateRange: { startDate: startDate || null, endDate: endDate || null },
      statistics,
      docs: purchaseEntriesData.map(entry => ({
        _id: entry._id,
        invoiceNumber: entry.invoiceNumber,
        invoiceDate: entry.invoiceDate,
        date: entry.date,
        lastInvoiceNumber: entry.lastInvoiceNumber,
        lastInvoicePrice: entry.lastInvoicePrice,
        grossTotal: entry.grossTotal,
        freight: entry.freight,
        flatDiscount: entry.flatDiscount,
        specialDiscount: entry.specialDiscount,
        grandTotal: entry.grandTotal,
        creditAmount: entry.creditAmount,
        paymentDetails: entry.paymentDetails,
        totalPaid: calculateTotalPaid(entry.paymentDetails),
        remainingBalance: entry.grandTotal - calculateTotalPaid(entry.paymentDetails),
        paymentStatus: determinePaymentStatus(entry),
        remarks: entry.remarks,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      purchaseEntries: purchaseEntriesData.map(entry => ({
        _id: entry._id,
        invoiceNumber: entry.invoiceNumber,
        invoiceDate: entry.invoiceDate,
        date: entry.date,
        lastInvoiceNumber: entry.lastInvoiceNumber,
        lastInvoicePrice: entry.lastInvoicePrice,
        grossTotal: entry.grossTotal,
        freight: entry.freight,
        flatDiscount: entry.flatDiscount,
        specialDiscount: entry.specialDiscount,
        grandTotal: entry.grandTotal,
        creditAmount: entry.creditAmount,
        paymentDetails: entry.paymentDetails,
        totalPaid: calculateTotalPaid(entry.paymentDetails),
        remainingBalance: entry.grandTotal - calculateTotalPaid(entry.paymentDetails),
        paymentStatus: determinePaymentStatus(entry),
        remarks: entry.remarks,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
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
    console.error('Error in getBrandReport:', error)
    throw error
  }
}

/**
 * Get brands report summary (all brands with their statistics)
 */
exports.getBrandsReportSummary = async (vendorId, options = {}) => {
  try {
    if (!vendorId) throw new Error('Vendor ID is required')
    const { brandId, startDate, endDate, paymentStatus, pageNumber = 1, pageSize = 10 } = options

    const brandQuery = { vendorId, isActive: true }
    if (brandId) brandQuery._id = brandId
    const brands = await Brand.find(brandQuery).sort({ brandName: 1 })

    const dateQuery = {}
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        dateQuery.invoiceDate = { $gte: start, $lte: end }
      }
    } else if (startDate) {
      const start = new Date(startDate)
      if (!isNaN(start.getTime())) dateQuery.invoiceDate = { $gte: start }
    } else if (endDate) {
      const end = new Date(endDate)
      if (!isNaN(end.getTime())) dateQuery.invoiceDate = { $lte: end }
    }

    const brandReportsPromises = brands.map(async (brand) => {
      const query = { vendorId, brandId: brand._id, isActive: true, ...dateQuery }
      const purchaseEntries = await PurchaseEntry.find(query).lean()

      let filteredEntries = purchaseEntries
      if (paymentStatus) {
        filteredEntries = purchaseEntries.filter(entry => {
          const status = determinePaymentStatus(entry)
          return status.toLowerCase() === paymentStatus.toLowerCase()
        })
      }

      const statistics = calculateBrandStatistics(filteredEntries)

      return {
        brandId: brand._id,
        brandName: brand.brandName,
        totalInvoices: statistics.totalInvoices,
        grossPurchaseAmount: statistics.grossPurchases,
        totalFreight: statistics.totalFreight,
        totalDiscount: statistics.totalDiscount,
        grandTotal: statistics.grandTotal,
        totalPaid: statistics.totalPaid,
        outstandingPayable: statistics.outstandingAmount
      }
    })

    const allBrandReports = await Promise.all(brandReportsPromises)
    const filteredReports = allBrandReports.filter(report => report.totalInvoices > 0)

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
    console.error('Error in getBrandsReportSummary:', error)
    throw error
  }
}

function calculateBrandStatistics(purchaseEntries) {
  const statistics = {
    totalInvoices: purchaseEntries.length,
    grossPurchases: 0,
    totalFreight: 0,
    totalDiscount: 0,
    grandTotal: 0,
    totalPaid: 0,
    outstandingAmount: 0
  }

  purchaseEntries.forEach(entry => {
    statistics.grossPurchases += entry.grossTotal || 0
    statistics.totalFreight += entry.freight || 0
    statistics.totalDiscount += (entry.flatDiscount || 0) + (entry.specialDiscount || 0)
    statistics.grandTotal += entry.grandTotal || 0

    const paid = calculateTotalPaid(entry.paymentDetails)
    statistics.totalPaid += paid
    statistics.outstandingAmount += (entry.grandTotal || 0) - paid
  })

  return statistics
}

function calculateTotalPaid(paymentDetails) {
  if (!paymentDetails || !Array.isArray(paymentDetails)) return 0
  return paymentDetails.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
}

function determinePaymentStatus(entry) {
  const creditAmount = entry.creditAmount || 0
  const totalPaid = calculateTotalPaid(entry.paymentDetails)
  const remainingCredit = creditAmount - totalPaid

  if (totalPaid >= entry.grandTotal || remainingCredit <= 0) return 'Paid'
  if (totalPaid > 0) return 'Partial'
  return 'Unpaid'
}

module.exports = exports
