const PurchaseEntry = require('../models/purchaseEntryModel');
const Brand = require('../models/brandModel');
const User = require('../models/userModel');

const purchaseEntrySeeder = async () => {
  try {
    // Check if purchase entries already exist
    const existingEntries = await PurchaseEntry.countDocuments();
    if (existingEntries > 0) {
      console.log('Purchase entries already exist. Skipping seeding.');
      return;
    }

    // Get vendors and brands for seeding
    const vendors = await User.find({ vendorRole: 'vendor' }).limit(3);
    const brands = await Brand.find().limit(5);

    if (vendors.length === 0 || brands.length === 0) {
      console.log('No vendors or brands found. Please seed them first.');
      return;
    }

    const samplePurchaseEntries = [
      {
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date('2024-01-15'),
        date: new Date('2024-01-15'),
        grossTotal: 150000,
        freight: 5000,
        flatDiscount: 2500,
        specialDiscount: 1000,
        grandTotal: 151500,
        cashPaid: 50000,
        creditAmount: 101500,
        remarks: 'First quarter medicine purchase',
        paymentDetails: [
          { date: new Date('2024-01-15'), amountPaid: 25000 },
          { date: new Date('2024-02-01'), amountPaid: 25000 }
        ]
      },
      {
        invoiceNumber: 'INV-2024-002',
        invoiceDate: new Date('2024-02-10'),
        date: new Date('2024-02-10'),
        grossTotal: 200000,
        freight: 8000,
        flatDiscount: 5000,
        specialDiscount: 2000,
        grandTotal: 205000,
        cashPaid: 100000,
        creditAmount: 105000,
        remarks: 'Cardiovascular medicines bulk purchase',
        paymentDetails: [
          { date: new Date('2024-02-10'), amountPaid: 50000 },
          { date: new Date('2024-03-01'), amountPaid: 50000 }
        ]
      },
      {
        invoiceNumber: 'INV-2024-003',
        invoiceDate: new Date('2024-03-05'),
        date: new Date('2024-03-05'),
        grossTotal: 180000,
        freight: 6000,
        flatDiscount: 3000,
        specialDiscount: 1500,
        grandTotal: 186500,
        cashPaid: 80000,
        creditAmount: 106500,
        remarks: 'Antibiotics and analgesics purchase',
        paymentDetails: [
          { date: new Date('2024-03-05'), amountPaid: 40000 },
          { date: new Date('2024-03-15'), amountPaid: 40000 }
        ]
      },
      {
        invoiceNumber: 'INV-2024-004',
        invoiceDate: new Date('2024-03-20'),
        date: new Date('2024-03-20'),
        grossTotal: 250000,
        freight: 10000,
        flatDiscount: 7500,
        specialDiscount: 2500,
        grandTotal: 260000,
        cashPaid: 150000,
        creditAmount: 110000,
        remarks: 'Monthly medicine stock replenishment',
        paymentDetails: [
          { date: new Date('2024-03-20'), amountPaid: 75000 },
          { date: new Date('2024-04-01'), amountPaid: 75000 }
        ]
      },
      {
        invoiceNumber: 'INV-2024-005',
        invoiceDate: new Date('2024-04-10'),
        date: new Date('2024-04-10'),
        grossTotal: 175000,
        freight: 5500,
        flatDiscount: 4000,
        specialDiscount: 1000,
        grandTotal: 183500,
        cashPaid: 90000,
        creditAmount: 93500,
        remarks: 'Special discount purchase - gastrointestinal medicines',
        paymentDetails: [
          { date: new Date('2024-04-10'), amountPaid: 45000 },
          { date: new Date('2024-04-25'), amountPaid: 45000 }
        ]
      }
    ];

    const entriesToInsert = [];

    // Create purchase entries for each vendor-brand combination
    for (const vendor of vendors) {
      for (const brand of brands.filter(b => b.vendorId.toString() === vendor._id.toString())) {
        // Add 2-3 entries per brand
        const entryCount = Math.floor(Math.random() * 2) + 2;

        for (let i = 0; i < entryCount && i < samplePurchaseEntries.length; i++) {
          const sampleEntry = samplePurchaseEntries[i];

          // Create unique invoice number
          const uniqueInvoiceNumber = `${sampleEntry.invoiceNumber}-${vendor._id.toString().slice(-4)}-${brand._id.toString().slice(-4)}`;

          // Check if this invoice number already exists
          const existingEntry = await PurchaseEntry.findOne({
            vendorId: vendor._id,
            invoiceNumber: uniqueInvoiceNumber
          });

          if (!existingEntry) {
            entriesToInsert.push({
              vendorId: vendor._id,
              brandId: brand._id,
              ...sampleEntry,
              invoiceNumber: uniqueInvoiceNumber,
              isActive: Math.random() > 0.05 // 95% chance of being active
            });
          }
        }
      }
    }

    if (entriesToInsert.length > 0) {
      await PurchaseEntry.insertMany(entriesToInsert);
      console.log(`${entriesToInsert.length} purchase entries seeded successfully!`);
    } else {
      console.log('No new purchase entries to seed.');
    }

  } catch (error) {
    console.error('Error seeding purchase entries:', error);
    throw error;
  }
};

module.exports = purchaseEntrySeeder;
