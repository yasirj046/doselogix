const dotenv = require('dotenv');
const mongoose = require("mongoose");
const SubArea = require("../models/subAreaModel");
const Area = require("../models/areaModel");
const User = require("../models/userModel");

dotenv.config();

const seedSubAreas = async () => {
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
    // Check if sub areas already exist
    const existingSubAreas = await SubArea.countDocuments();
    if (existingSubAreas > 0) {
      console.log("Sub areas already exist in the database");
      return process.exit();
    }

    // Get a default vendor for seeding (vendor who has areas)
    const vendorsWithAreas = await User.find({ vendorRole: { $in: ['vendor', 'admin'] } });
    
    let defaultVendor = null;
    for (const vendor of vendorsWithAreas) {
      const areaCount = await Area.countDocuments({ vendorId: vendor._id });
      if (areaCount > 0) {
        defaultVendor = vendor;
        break;
      }
    }
    
    if (!defaultVendor) {
      console.log("No vendor found with areas for seeding sub areas");
      return process.exit();
    }

    console.log(`Using vendor: ${defaultVendor.vendorName} (${defaultVendor._id})`);

    // Get existing areas for this vendor
    const existingAreas = await Area.find({ vendorId: defaultVendor._id });
    if (existingAreas.length === 0) {
      console.log("No areas found for seeding sub areas. Please seed areas first.");
      return process.exit();
    }

    console.log(`Found ${existingAreas.length} areas for vendor ${defaultVendor.vendorName}`);

    // Sample sub areas data
    const subAreasData = [];

    // Create sub areas for each existing area
    existingAreas.forEach(area => {
      switch (area.area) {
        case "Downtown":
          subAreasData.push(
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Business District"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Shopping Mall"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Financial Center"
            }
          );
          break;
        case "Residential Zone":
          subAreasData.push(
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Sector A"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Sector B"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Sector C"
            }
          );
          break;
        case "Industrial Area":
          subAreasData.push(
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Phase 1"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Phase 2"
            }
          );
          break;
        case "Market Area":
          subAreasData.push(
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Local Market"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Wholesale Market"
            }
          );
          break;
        case "Educational District":
          subAreasData.push(
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "University Area"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "School Zone"
            }
          );
          break;
        default:
          // For other areas, create generic sub areas
          subAreasData.push(
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "Central"
            },
            {
              vendorId: defaultVendor._id,
              areaId: area._id,
              subAreaName: "North"
            }
          );
          break;
      }
    });

    // Insert the sub areas
    const insertedSubAreas = await SubArea.insertMany(subAreasData);
    console.log(`Successfully seeded ${insertedSubAreas.length} sub areas`);
    
    // Log the created sub areas with their parent areas
    for (const subArea of insertedSubAreas) {
      const populatedSubArea = await SubArea.findById(subArea._id)
        .populate('areaId', 'area')
        .populate('vendorId', 'vendorName');
      console.log(`- ${populatedSubArea.areaId.area} → ${populatedSubArea.subAreaName}`);
    }

  } catch (error) {
    console.error('Error seeding sub areas:', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedSubAreas();
