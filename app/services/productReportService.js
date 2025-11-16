const SalesProduct = require('../models/salesProductModel')
const SalesInvoice = require('../models/salesInvoiceModel')
const Product = require('../models/productModel')
const UserCustomers = require('../models/userCustomersModel')

/**
 * Get product report with all sales grouped by product, customer, and area
 * @param {String} vendorId
 * @param {Object} options
 */
exports.getProductReport = async (vendorId, options = {}) => {
  try {
    if (!vendorId) throw new Error('Vendor ID is required')

    const {
      productId,
      brandId,
      groupId,
      subGroupId,
      customerId,
      areaId,
      subAreaId,
      startDate,
      endDate,
      pageNumber = 1,
      pageSize = 10,
      keyword = ''
    } = options

    // Step 1: Build product query to get matching products
    const productQuery = { vendorId, isActive: true }
    if (productId) productQuery._id = productId
    if (brandId) productQuery.brandId = brandId
    if (groupId) productQuery.groupId = groupId
    if (subGroupId) productQuery.subGroupId = subGroupId

    // Get all matching products
    const products = await Product.find(productQuery).lean()
    
    if (!products || products.length === 0) {
      return {
        docs: [],
        totalDocs: 0,
        limit: pageSize,
        page: pageNumber,
        totalPages: 0,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      }
    }

    const productIds = products.map(p => p._id)

    // Step 2: Build invoice query
    const invoiceQuery = { vendorId, isActive: true }

    if (customerId) invoiceQuery.customerId = customerId
    
    // If area or subarea filters are provided, first get matching customers
    if (areaId || subAreaId) {
      const customerQuery = { vendorId, isActive: true }
      if (areaId) customerQuery.customerArea = areaId
      if (subAreaId) customerQuery.customerSubArea = subAreaId
      
      const matchingCustomers = await UserCustomers.find(customerQuery).select('_id').lean()
      const matchingCustomerIds = matchingCustomers.map(c => c._id)
      
      if (matchingCustomerIds.length === 0) {
        return {
          docs: [],
          totalDocs: 0,
          limit: pageSize,
          page: pageNumber,
          totalPages: 0,
          pagingCounter: 0,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null
        }
      }
      
      // Add customer filter to invoice query
      if (customerId) {
        // Check if the selected customerId is in the matching customers
        if (!matchingCustomerIds.find(id => id.toString() === customerId.toString())) {
          return {
            docs: [],
            totalDocs: 0,
            limit: pageSize,
            page: pageNumber,
            totalPages: 0,
            pagingCounter: 0,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null
          }
        }
      } else {
        invoiceQuery.customerId = { $in: matchingCustomerIds }
      }
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        invoiceQuery.date = { $gte: start, $lte: end }
      }
    } else if (startDate) {
      const start = new Date(startDate)
      if (!isNaN(start.getTime())) invoiceQuery.date = { $gte: start }
    } else if (endDate) {
      const end = new Date(endDate)
      if (!isNaN(end.getTime())) invoiceQuery.date = { $lte: end }
    }

    // Get all matching invoices
    const invoices = await SalesInvoice.find(invoiceQuery)
      .populate('customerId', 'customerName customerArea customerSubArea')
      .lean()

    if (!invoices || invoices.length === 0) {
      return {
        docs: [],
        totalDocs: 0,
        limit: pageSize,
        page: pageNumber,
        totalPages: 0,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      }
    }

    const invoiceIds = invoices.map(inv => inv._id)

    // Step 3: Build sales product query
    const salesProductQuery = { 
      salesInvoiceId: { $in: invoiceIds },
      productId: { $in: productIds }
    }

    // Get all sales products
    const salesProducts = await SalesProduct.find(salesProductQuery)
      .populate('productId', 'productName brandId groupId subGroupId')
      .lean()

    // Create a map of invoices for quick lookup
    const invoiceMap = {}
    invoices.forEach(inv => {
      invoiceMap[inv._id.toString()] = inv
    })

    // Create a map of products for quick lookup
    const productMap = {}
    products.forEach(p => {
      productMap[p._id.toString()] = p
    })

    // Group sales products by product + customer + area
    const groupedData = {}

    for (const sp of salesProducts) {
      const invoice = invoiceMap[sp.salesInvoiceId.toString()]
      if (!invoice || !invoice.customerId) continue

      const product = productMap[sp.productId._id.toString()]
      if (!product) continue

      const customer = invoice.customerId
      const areaIdStr = customer.customerArea ? customer.customerArea.toString() : 'no-area'
      const subAreaIdStr = customer.customerSubArea ? customer.customerSubArea.toString() : 'no-subarea'

      const key = `${product._id}-${customer._id}-${areaIdStr}-${subAreaIdStr}`

      if (!groupedData[key]) {
        groupedData[key] = {
          productId: product._id,
          productName: product.productName,
          brandId: product.brandId,
          groupId: product.groupId,
          subGroupId: product.subGroupId,
          customerId: customer._id,
          customerName: customer.customerName,
          areaId: customer.customerArea || null,
          subAreaId: customer.customerSubArea || null,
          totalQuantity: 0,
          totalReturnQuantity: 0,
          netQuantity: 0,
          totalBonus: 0,
          totalInvoices: 0,
          invoiceIds: new Set()
        }
      }

      groupedData[key].totalQuantity += sp.quantity || 0
      groupedData[key].totalReturnQuantity += sp.returnQuantity || 0
      groupedData[key].totalBonus += sp.bonus || 0
      groupedData[key].invoiceIds.add(sp.salesInvoiceId.toString())
    }

    // Convert to array and calculate total invoices and net quantity
    let allRecords = Object.values(groupedData).map(item => ({
      ...item,
      netQuantity: (item.totalQuantity || 0) - (item.totalReturnQuantity || 0),
      totalInvoices: item.invoiceIds.size,
      invoiceIds: undefined // Remove Set from response
    }))

    // Apply keyword filter
    if (keyword && keyword !== '') {
      const keywordLower = keyword.toLowerCase()
      allRecords = allRecords.filter(item =>
        item.productName.toLowerCase().includes(keywordLower) ||
        item.customerName.toLowerCase().includes(keywordLower)
      )
    }

    // Populate brand, group, subgroup, area and subarea names
    const recordsWithDetails = await Promise.all(
      allRecords.map(async record => {
        let brandName = 'N/A'
        let groupName = 'N/A'
        let subGroupName = 'N/A'
        let areaName = 'N/A'
        let subAreaName = 'N/A'

        if (record.brandId) {
          const Brand = require('../models/brandModel')
          const brand = await Brand.findById(record.brandId).lean()
          if (brand) brandName = brand.brandName
        }

        if (record.groupId) {
          const Group = require('../models/groupModel')
          const group = await Group.findById(record.groupId).lean()
          if (group) groupName = group.groupName
        }

        if (record.subGroupId) {
          const SubGroup = require('../models/subGroupModel')
          const subGroup = await SubGroup.findById(record.subGroupId).lean()
          if (subGroup) subGroupName = subGroup.subGroupName
        }

        if (record.areaId) {
          const Area = require('../models/areaModel')
          const area = await Area.findById(record.areaId).lean()
          if (area) areaName = area.area
        }

        if (record.subAreaId) {
          const SubArea = require('../models/subAreaModel')
          const subArea = await SubArea.findById(record.subAreaId).lean()
          if (subArea) subAreaName = subArea.subAreaName
        }

        return {
          ...record,
          brandName,
          groupName,
          subGroupName,
          areaName,
          subAreaName
        }
      })
    )

    // Pagination
    const totalDocs = recordsWithDetails.length
    const skip = (pageNumber - 1) * pageSize
    const paginatedRecords = recordsWithDetails.slice(skip, skip + pageSize)

    return {
      docs: paginatedRecords,
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
    console.error('Error in getProductReport:', error)
    throw error
  }
}

/**
 * Get detailed product report for a specific product, customer, area, and subarea combination
 * @param {String} vendorId
 * @param {String} productId
 * @param {String} customerId
 * @param {Object} options
 */
exports.getProductDetailedReport = async (vendorId, productId, customerId, options = {}) => {
  try {
    if (!vendorId || !productId || !customerId) {
      throw new Error('Vendor ID, Product ID, and Customer ID are required')
    }

    const { areaId, subAreaId, startDate, endDate, pageNumber = 1, pageSize = 10, keyword = '' } = options

    // Get product details
    const product = await Product.findOne({ _id: productId, vendorId, isActive: true })
      .populate('brandId', 'brandName')
      .populate('groupId', 'groupName')
      .populate('subGroupId', 'subGroupName')
      .lean()

    if (!product) throw new Error('Product not found or not active')

    // Get customer details
    const customer = await UserCustomers.findOne({ _id: customerId, vendorId, isActive: true })
      .lean()

    if (!customer) throw new Error('Customer not found or not active')

    // Build invoice query
    const invoiceQuery = { vendorId, customerId, isActive: true }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        invoiceQuery.date = { $gte: start, $lte: end }
      }
    } else if (startDate) {
      const start = new Date(startDate)
      if (!isNaN(start.getTime())) invoiceQuery.date = { $gte: start }
    } else if (endDate) {
      const end = new Date(endDate)
      if (!isNaN(end.getTime())) invoiceQuery.date = { $lte: end }
    }

    // Get all matching invoices
    const invoices = await SalesInvoice.find(invoiceQuery).lean()
    const invoiceIds = invoices.map(inv => inv._id)

    // Get all sales products for this product
    const salesProducts = await SalesProduct.find({
      salesInvoiceId: { $in: invoiceIds },
      productId: productId
    })
      .populate('salesInvoiceId')
      .lean()

    // Apply keyword filter
    let filteredProducts = salesProducts
    if (keyword && keyword !== '') {
      filteredProducts = salesProducts.filter(sp => {
        const invoice = sp.salesInvoiceId
        return (
          invoice.salesInvoiceNumber?.toLowerCase().includes(keyword.toLowerCase()) ||
          sp.batchNumber?.toLowerCase().includes(keyword.toLowerCase())
        )
      })
    }

    // Calculate statistics
    const statistics = {
      totalQuantity: 0,
      totalReturnQuantity: 0,
      netQuantity: 0,
      totalBonus: 0,
      totalDiscount: 0,
      totalAmount: 0,
      totalInvoices: new Set(filteredProducts.map(sp => sp.salesInvoiceId._id.toString())).size
    }

    filteredProducts.forEach(sp => {
      statistics.totalQuantity += sp.quantity || 0
      statistics.totalReturnQuantity += sp.returnQuantity || 0
      statistics.totalBonus += sp.bonus || 0
      // Calculate discount from percentageDiscount and flatDiscount
      const grossAmount = (sp.quantity || 0) * (sp.price || 0)
      const percentageDiscountAmount = (grossAmount * (sp.percentageDiscount || 0)) / 100
      const totalDiscountAmount = percentageDiscountAmount + (sp.flatDiscount || 0)
      statistics.totalDiscount += totalDiscountAmount
      statistics.totalAmount += sp.totalAmount || 0
    })
    
    // Calculate net quantity (quantity - returns)
    statistics.netQuantity = statistics.totalQuantity - statistics.totalReturnQuantity

    // Pagination
    const totalDocs = filteredProducts.length
    const skip = (pageNumber - 1) * pageSize
    const paginatedProducts = filteredProducts.slice(skip, skip + pageSize)

    // Format the response
    const docs = paginatedProducts.map(sp => {
      const invoice = sp.salesInvoiceId
      // Calculate discount for display
      const grossAmount = (sp.quantity || 0) * (sp.price || 0)
      const percentageDiscountAmount = (grossAmount * (sp.percentageDiscount || 0)) / 100
      const totalDiscountAmount = percentageDiscountAmount + (sp.flatDiscount || 0)
      
      return {
        _id: sp._id,
        salesInvoiceId: invoice._id,
        salesInvoiceNumber: invoice.salesInvoiceNumber,
        invoiceDate: invoice.date,
        batchNumber: sp.batchNumber,
        quantity: sp.quantity,
        returnQuantity: sp.returnQuantity || 0,
        netQuantity: (sp.quantity || 0) - (sp.returnQuantity || 0),
        bonus: sp.bonus,
        rate: sp.price,
        discount: totalDiscountAmount,
        percentageDiscount: sp.percentageDiscount,
        flatDiscount: sp.flatDiscount,
        totalAmount: sp.totalAmount,
        expiryDate: sp.expiry,
        remarks: sp.remarks
      }
    })

    // Get area and subarea info (customer uses customerArea/customerSubArea)
    let areaName = 'N/A'
    let subAreaName = 'N/A'

    if (customer.customerArea) {
      const Area = require('../models/areaModel')
      const area = await Area.findById(customer.customerArea).lean()
      if (area) areaName = area.area
    }

    if (customer.customerSubArea) {
      const SubArea = require('../models/subAreaModel')
      const subArea = await SubArea.findById(customer.customerSubArea).lean()
      if (subArea) subAreaName = subArea.subAreaName
    }

    return {
      product: {
        _id: product._id,
        productName: product.productName,
        brandId: product.brandId ? product.brandId._id : null,
        brandName: product.brandId ? product.brandId.brandName : 'N/A',
        groupId: product.groupId ? product.groupId._id : null,
        groupName: product.groupId ? product.groupId.groupName : 'N/A',
        subGroupId: product.subGroupId ? product.subGroupId._id : null,
        subGroupName: product.subGroupId ? product.subGroupId.subGroupName : 'N/A'
      },
      customer: {
        _id: customer._id,
        customerName: customer.customerName,
        customerAddress: customer.customerAddress,
        areaId: customer.customerArea || null,
        areaName,
        subAreaId: customer.customerSubArea || null,
        subAreaName
      },
      statistics,
      docs,
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
    console.error('Error in getProductDetailedReport:', error)
    throw error
  }
}

module.exports = exports
