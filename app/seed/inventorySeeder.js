require("dotenv").config();
const mongoose = require("mongoose");
const Inventory = require("../models/inventoryModel");
const Brand = require("../models/brandModel");
const Product = require("../models/productModel");

const seedInventory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || 'pharmaceutical_dms',
    });

    // Clear existing inventory data
    await Inventory.deleteMany({});
    console.log("Cleared existing inventory data");

    // Get some brands and products for seeding
    const brands = await Brand.find({}).limit(3);
    const products = await Product.find({}).limit(5);

    if (brands.length === 0 || products.length === 0) {
      console.log("Please seed brands and products first before seeding inventory");
      process.exit(1);
    }

    // Sample inventory data
    const sampleInventories = [
      {
        date: new Date('2024-01-15'),
        brandId: brands[0]._id,
        brandInvoice: "INV-2024-001",
        brandInvoiceDate: new Date('2024-01-15'),
        products: [
          {
            productId: products[0]._id,
            batchNumber: "BATCH001",
            expiry: new Date('2025-12-31'),
            cartons: 10,
            pieces: 5,
            bonus: 1,
            netPrice: 50.00,
            discountPercentage: 5
          },
          {
            productId: products[1]._id,
            batchNumber: "BATCH002",
            expiry: new Date('2025-11-30'),
            cartons: 5,
            pieces: 10,
            bonus: 0,
            netPrice: 25.00,
            discountPercentage: 10
          }
        ],
        flatDiscount: 100,
        specialDiscountPercentage: 2,
        freight: 50,
        remarksForInvoice: "Sample inventory entry 1"
      },
      {
        date: new Date('2024-01-20'),
        brandId: brands[1]._id,
        brandInvoice: "INV-2024-002",
        brandInvoiceDate: new Date('2024-01-20'),
        products: [
          {
            productId: products[2]._id,
            batchNumber: "BATCH003",
            expiry: new Date('2025-10-31'),
            cartons: 20,
            pieces: 0,
            bonus: 2,
            netPrice: 75.00,
            discountPercentage: 8
          }
        ],
        flatDiscount: 200,
        specialDiscountPercentage: 3,
        freight: 75,
        remarksForInvoice: "Sample inventory entry 2"
      }
    ];

    // Create inventory entries using the service
    const inventoryService = require("../services/inventoryService");
    
    for (const inventoryData of sampleInventories) {
      await inventoryService.createInventory(inventoryData);
    }

    console.log("Sample inventory data seeded successfully");
    process.exit(0);

  } catch (error) {
    console.error("Error seeding inventory data:", error);
    process.exit(1);
  }
};

seedInventory();
