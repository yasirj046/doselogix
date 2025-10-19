const mongoose = require('mongoose');
const SalesInvoice = require('../models/salesInvoiceModel');
const SalesProduct = require('../models/salesProductModel');
const UserCustomer = require('../models/userCustomersModel');
const Employee = require('../models/employeeModel');
const Inventory = require('../models/inventoryModel');
const User = require('../models/userModel');

const salesInvoiceSeedData = [
  {
    customerId: null, // Will be set dynamically
    date: new Date('2024-01-15'),
    licenseNumber: 'LIC001',
    licenseExpiry: new Date('2025-12-31'),
    lastInvoiceBalance: 500,
    deliverBy: null, // Will be set dynamically
    bookedBy: null, // Will be set dynamically
    deliveryLogNumber: 'DL20240115EMP1001',
    subtotal: 2500,
    totalDiscount: 100,
    grandTotal: 2400,
    cash: 1500,
    credit: 900,
    remarks: 'First sales invoice - priority customer',
    paymentDetails: [
      {
        date: new Date('2024-01-20'),
        amountPaid: 400
      }
    ],
    isActive: true
  },
  {
    customerId: null, // Will be set dynamically
    date: new Date('2024-01-20'),
    licenseNumber: 'LIC002',
    licenseExpiry: new Date('2025-06-30'),
    lastInvoiceBalance: 0,
    deliverBy: null, // Will be set dynamically
    bookedBy: null, // Will be set dynamically
    deliveryLogNumber: 'DL20240120EMP1002',
    subtotal: 1800,
    totalDiscount: 50,
    grandTotal: 1750,
    cash: 1750,
    credit: 0,
    remarks: 'Cash payment - bulk order',
    paymentDetails: [],
    isActive: true
  },
  {
    customerId: null, // Will be set dynamically
    date: new Date('2024-01-25'),
    licenseNumber: 'LIC003',
    licenseExpiry: new Date('2025-09-15'),
    lastInvoiceBalance: 200,
    deliverBy: null, // Will be set dynamically
    bookedBy: null, // Will be set dynamically
    deliveryLogNumber: 'DL20240125EMP1003',
    subtotal: 3200,
    totalDiscount: 200,
    grandTotal: 3000,
    cash: 2000,
    credit: 1000,
    remarks: 'Regular customer order',
    paymentDetails: [
      {
        date: new Date('2024-01-30'),
        amountPaid: 500
      }
    ],
    isActive: true
  }
];

const salesProductSeedData = [
  // Products for first sales invoice
  {
    salesInvoiceId: null, // Will be set dynamically
    productId: null, // Will be set dynamically
    inventoryId: null, // Will be set dynamically
    productName: 'Paracetamol 500mg',
    batchNumber: 'BATCH001',
    expiry: new Date('2025-06-30'),
    availableStock: 1000,
    quantity: 50,
    bonus: 5,
    totalQuantity: 55,
    lessToMinimumCheck: false,
    price: 25,
    percentageDiscount: 2,
    flatDiscount: 10,
    effectiveCostPerPiece: 22.27,
    totalAmount: 1225,
    originalSalePrice: 25,
    minSalePrice: 20,
    isActive: true
  },
  {
    salesInvoiceId: null, // Will be set dynamically
    productId: null, // Will be set dynamically
    inventoryId: null, // Will be set dynamically
    productName: 'Amoxicillin 250mg',
    batchNumber: 'BATCH002',
    expiry: new Date('2025-08-15'),
    availableStock: 800,
    quantity: 30,
    bonus: 2,
    totalQuantity: 32,
    lessToMinimumCheck: false,
    price: 40,
    percentageDiscount: 0,
    flatDiscount: 0,
    totalAmount: 1200,
    effectiveCostPerPiece: 37.5,
    originalSalePrice: 40,
    minSalePrice: 35,
    isActive: true
  },
  // Products for second sales invoice
  {
    salesInvoiceId: null, // Will be set dynamically
    productId: null, // Will be set dynamically
    inventoryId: null, // Will be set dynamically
    productName: 'Ibuprofen 400mg',
    batchNumber: 'BATCH003',
    expiry: new Date('2025-04-20'),
    availableStock: 600,
    quantity: 40,
    bonus: 4,
    totalQuantity: 44,
    lessToMinimumCheck: false,
    price: 45,
    percentageDiscount: 1,
    flatDiscount: 25,
    effectiveCostPerPiece: 38.18,
    totalAmount: 1755,
    originalSalePrice: 45,
    minSalePrice: 40,
    isActive: true
  },
  // Products for third sales invoice
  {
    salesInvoiceId: null, // Will be set dynamically
    productId: null, // Will be set dynamically
    inventoryId: null, // Will be set dynamically
    productName: 'Cetirizine 10mg',
    batchNumber: 'BATCH004',
    expiry: new Date('2025-10-30'),
    availableStock: 500,
    quantity: 60,
    bonus: 6,
    totalQuantity: 66,
    lessToMinimumCheck: false,
    price: 15,
    percentageDiscount: 3,
    flatDiscount: 0,
    effectiveCostPerPiece: 13.64,
    totalAmount: 873,
    originalSalePrice: 15,
    minSalePrice: 12,
    isActive: true
  },
  {
    salesInvoiceId: null, // Will be set dynamically
    productId: null, // Will be set dynamically
    inventoryId: null, // Will be set dynamically
    productName: 'Omeprazole 20mg',
    batchNumber: 'BATCH005',
    expiry: new Date('2025-07-25'),
    availableStock: 750,
    quantity: 35,
    bonus: 3,
    totalQuantity: 38,
    lessToMinimumCheck: false,
    price: 60,
    percentageDiscount: 5,
    flatDiscount: 100,
    effectiveCostPerPiece: 52.63,
    totalAmount: 1900,
    originalSalePrice: 60,
    minSalePrice: 50,
    isActive: true
  }
];

const seedSalesInvoices = async () => {
  try {
    // Clear existing data
    await SalesInvoice.deleteMany({});
    await SalesProduct.deleteMany({});
    console.log('Cleared existing sales data');

    // Get vendors (users)
    const vendors = await User.find({ userType: 'vendor' }).limit(3);
    if (vendors.length === 0) {
      console.log('No vendors found. Please seed users first.');
      return;
    }

    // Get customers for each vendor
    const customers = await UserCustomer.find({ vendorId: { $in: vendors.map(v => v._id) } });
    if (customers.length === 0) {
      console.log('No customers found. Please seed customers first.');
      return;
    }

    // Get employees for each vendor
    const employees = await Employee.find({ vendorId: { $in: vendors.map(v => v._id) } });
    if (employees.length === 0) {
      console.log('No employees found. Please seed employees first.');
      return;
    }

    // Get inventory items
    const inventoryItems = await Inventory.find({ 
      vendorId: { $in: vendors.map(v => v._id) },
      currentQuantity: { $gt: 0 }
    }).populate('productId');
    
    if (inventoryItems.length === 0) {
      console.log('No inventory items found. Please seed inventory first.');
      return;
    }

    console.log(`Found ${vendors.length} vendors, ${customers.length} customers, ${employees.length} employees, ${inventoryItems.length} inventory items`);

    const createdSalesInvoices = [];
    const createdSalesProducts = [];

    for (let i = 0; i < salesInvoiceSeedData.length && i < vendors.length; i++) {
      const vendor = vendors[i];
      
      // Get customers for this vendor
      const vendorCustomers = customers.filter(c => c.vendorId.toString() === vendor._id.toString());
      if (vendorCustomers.length === 0) continue;

      // Get employees for this vendor
      const vendorEmployees = employees.filter(e => e.vendorId.toString() === vendor._id.toString());
      if (vendorEmployees.length === 0) continue;

      // Get inventory for this vendor
      const vendorInventory = inventoryItems.filter(inv => inv.vendorId.toString() === vendor._id.toString());
      if (vendorInventory.length === 0) continue;

      const salesInvoiceData = {
        ...salesInvoiceSeedData[i],
        vendorId: vendor._id,
        customerId: vendorCustomers[0]._id,
        deliverBy: vendorEmployees[0]._id,
        bookedBy: vendorEmployees[vendorEmployees.length > 1 ? 1 : 0]._id,
        licenseNumber: vendorCustomers[0].customerLicenseNumber,
        licenseExpiry: vendorCustomers[0].customerLicenseExpiryDate
      };

      const createdSalesInvoice = await SalesInvoice.create(salesInvoiceData);
      createdSalesInvoices.push(createdSalesInvoice);

      console.log(`Created sales invoice ${i + 1} for vendor: ${vendor.vendorName}`);

      // Create products for this sales invoice
      const productsForInvoice = i === 0 ? 2 : i === 1 ? 1 : 2; // First invoice: 2 products, Second: 1 product, Third: 2 products
      
      for (let j = 0; j < productsForInvoice && j < vendorInventory.length; j++) {
        const inventoryItem = vendorInventory[j];
        const productIndex = (i * 2) + j; // Calculate which product data to use
        
        if (productIndex < salesProductSeedData.length) {
          const salesProductData = {
            ...salesProductSeedData[productIndex],
            salesInvoiceId: createdSalesInvoice._id,
            vendorId: vendor._id,
            productId: inventoryItem.productId._id,
            inventoryId: inventoryItem._id,
            productName: inventoryItem.productId.productName,
            batchNumber: inventoryItem.batchNumber,
            expiry: inventoryItem.expiryDate,
            availableStock: inventoryItem.currentQuantity,
            originalSalePrice: inventoryItem.salePrice,
            minSalePrice: inventoryItem.minSalePrice
          };

          const createdSalesProduct = await SalesProduct.create(salesProductData);
          createdSalesProducts.push(createdSalesProduct);

          // Update inventory - deduct sold quantity
          await Inventory.findByIdAndUpdate(
            inventoryItem._id,
            {
              $inc: { currentQuantity: -salesProductData.quantity },
              lastUpdated: new Date()
            }
          );

          console.log(`Created sales product: ${salesProductData.productName} for invoice ${i + 1}`);
        }
      }
    }

    console.log('\n=== SALES SEEDING COMPLETED ===');
    console.log(`Created ${createdSalesInvoices.length} sales invoices`);
    console.log(`Created ${createdSalesProducts.length} sales products`);
    console.log('Updated inventory quantities');

    return {
      salesInvoices: createdSalesInvoices,
      salesProducts: createdSalesProducts
    };

  } catch (error) {
    console.error('Error seeding sales invoices:', error);
    throw error;
  }
};

module.exports = { seedSalesInvoices };
