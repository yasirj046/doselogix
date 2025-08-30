const dotenv = require('dotenv');
const mongoose = require("mongoose");
const Area = require("../models/areaModel");
const User = require("../models/userModel");

dotenv.config();

const seedAreas = async () => {
  mongoose
  .connect(
    "mongodb+srv://wsglam010:WSGlam0010@cluster1.i8pjuew.mongodb.net/DoseLogix?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    }
  )
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => console.log(error));

  try {
    // Check if areas already exist
    const existingAreas = await Area.countDocuments();
    if (existingAreas > 0) {
      console.log("Areas already exist in the database");
      return process.exit();
    }

    // Get a default vendor for seeding (first vendor in the database)
    const defaultVendor = await User.findOne({ vendorRole: { $in: ['vendor', 'admin'] } });
    if (!defaultVendor) {
      console.log("No vendor found for seeding areas");
      return process.exit();
    }

    // Sample areas data
    const areasData = [
      {
        vendorId: defaultVendor._id,
        area: "Downtown",
        subArea: "Business District",
      },
      {
        vendorId: defaultVendor._id,
        area: "Downtown",
        subArea: "Shopping Mall",
      },
      {
        vendorId: defaultVendor._id,
        area: "Residential Zone",
        subArea: "Sector A",
      },
      {
        vendorId: defaultVendor._id,
        area: "Residential Zone",
        subArea: "Sector B",
      },
      {
        vendorId: defaultVendor._id,
        area: "Industrial Area",
        subArea: "Phase 1",
      },
      {
        vendorId: defaultVendor._id,
        area: "Industrial Area",
        subArea: "Phase 2",
      },
      {
        vendorId: defaultVendor._id,
        area: "Market Area",
        subArea: "Local Market",
      },
      {
        vendorId: defaultVendor._id,
        area: "Market Area",
        subArea: "Wholesale Market",
      },
      {
        vendorId: defaultVendor._id,
        area: "University Town",
        subArea: "Campus Area",
      },
      {
        vendorId: defaultVendor._id,
        area: "University Town",
        subArea: "Hostels",
      }
    ];

    // Insert the areas
    const insertedAreas = await Area.insertMany(areasData);
    console.log(`Successfully seeded ${insertedAreas.length} areas`);
    
    // Log the created areas
    insertedAreas.forEach(area => {
      console.log(`- ${area.area} - ${area.subArea}`);
    });

  } catch (error) {
    console.error('Error seeding areas:', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedAreas();
