const mongoose = require('mongoose');
const Brand = require('../models/brandModel');
const BrandCounter = require('../models/brandCounterModel');
const dotenv = require('dotenv');

dotenv.config();

const brandSeedData = [
  {
    name: "Metro Pharmaceuticals",
    province: "Punjab",
    city: "Lahore",
    address: "Plot 123, Industrial Area, Lahore, Punjab",
    primaryContact: "+92-300-1234567",
    secondaryContact: "+92-321-7654321"
  },
  {
    name: "Karachi Medical Supplies",
    province: "Sindh", 
    city: "Karachi",
    address: "Block B, Medical Complex, Karachi, Sindh",
    primaryContact: "+92-331-9876543",
    secondaryContact: "+92-342-1357924"
  },
  {
    name: "Capital Health Solutions",
    province: "Islamabad Capital Territory",
    city: "Islamabad", 
    address: "Sector F-10, Blue Area, Islamabad",
    primaryContact: "+92-51-2345678",
    secondaryContact: "+92-300-8765432"
  },
  {
    name: "Peshawar Pharma Hub",
    province: "Khyber Pakhtunkhwa",
    city: "Peshawar",
    address: "University Road, Peshawar, KPK",
    primaryContact: "+92-91-5678901",
    secondaryContact: "+92-345-2468135"
  }
];

const seedBrands = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'yasir460',
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Brand.deleteMany({});
    await BrandCounter.deleteMany({});
    console.log('Cleared existing brand data');

    // Import the brandService to use createBrand function
    const brandService = require('../services/brandService');

    // Create brands using the service (this will auto-generate IDs)
    for (const brandData of brandSeedData) {
      const brand = await brandService.createBrand(brandData);
      console.log(`Created brand: ${brand.name} with ID: ${brand.brandId}`);
    }

    console.log('Brand seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding brands:', error);
    process.exit(1);
  }
};

seedBrands();
