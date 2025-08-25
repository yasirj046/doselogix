require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/userModel");
const UserCustomers = require("../models/userCustomersModel");

const seedUserCustomers = async () => {
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

  // Find both vendors
  const saadVendor = await User.findOne({ vendorEmail: "saad05858@gmail.com" });
  const yasirVendor = await User.findOne({ vendorEmail: "yasirjamil460@gmail.com" });
  
  if (!saadVendor || !yasirVendor) {
    console.log("Both vendors not found. Please run userSeeder first.");
    return process.exit(1);
  }

  // Check if customers already exist for both vendors
  const existingSaadCustomers = await UserCustomers.findOne({ vendorId: saadVendor._id });
  const existingYasirCustomers = await UserCustomers.findOne({ vendorId: yasirVendor._id });
  
  if (existingSaadCustomers && existingYasirCustomers) {
    console.log("Sample customers already exist for both vendors");
    return process.exit();
  }

  // Create 22 customers for Saad
  if (!existingSaadCustomers) {
    const saadCustomers = [
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-001",
        customerName: "City Hospital Pharmacy",
        customerProvince: "Punjab",
        customerCity: "Lahore",
        customerAddress: "Main Boulevard, Gulberg III, Lahore",
        customerCategory: "Hospital",
        customerArea: "Gulberg",
        customerSubArea: "Gulberg III",
        customerPrimaryContact: "+92-300-1111111",
        customerSecondaryContact: "+92-42-35111111",
        customerCnic: "35202-1234567-1",
        customerLicenseNumber: "HL-2024-001",
        customerLicenseExpiryDate: new Date("2025-06-30")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-002",
        customerName: "Green Valley Pharmacy",
        customerProvince: "Punjab",
        customerCity: "Faisalabad",
        customerAddress: "Civil Lines, Near GPO, Faisalabad",
        customerCategory: "Pharmacy",
        customerArea: "Civil Lines",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-2222222",
        customerSecondaryContact: null,
        customerCnic: "33101-2345678-2",
        customerLicenseNumber: "PH-2024-002",
        customerLicenseExpiryDate: new Date("2025-08-15")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-003",
        customerName: "Karachi Medical Store",
        customerProvince: "Sindh",
        customerCity: "Karachi",
        customerAddress: "Saddar Town, Karachi",
        customerCategory: "Retailer",
        customerArea: "Saddar",
        customerSubArea: "Saddar Town",
        customerPrimaryContact: "+92-300-3333333",
        customerSecondaryContact: "+92-21-32111111",
        customerCnic: "42101-3456789-3",
        customerLicenseNumber: "RT-2024-003",
        customerLicenseExpiryDate: new Date("2025-03-20")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-004",
        customerName: "Northern Pharmaceuticals",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Peshawar",
        customerAddress: "University Road, Peshawar",
        customerCategory: "Wholesaler",
        customerArea: "University Town",
        customerSubArea: "Phase 1",
        customerPrimaryContact: "+92-300-4444444",
        customerSecondaryContact: "+92-91-5111111",
        customerCnic: "17101-4567890-4",
        customerLicenseNumber: "WH-2024-004",
        customerLicenseExpiryDate: new Date("2025-12-10")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-005",
        customerName: "Quetta General Hospital",
        customerProvince: "Balochistan",
        customerCity: "Quetta",
        customerAddress: "Jinnah Road, Quetta",
        customerCategory: "Hospital",
        customerArea: "Cantonment",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-5555555",
        customerSecondaryContact: "+92-81-2111111",
        customerCnic: "54301-5678901-5",
        customerLicenseNumber: "HL-2024-005",
        customerLicenseExpiryDate: new Date("2025-04-25")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-006",
        customerName: "Lahore Medical Center",
        customerProvince: "Punjab",
        customerCity: "Lahore",
        customerAddress: "Model Town, Lahore",
        customerCategory: "Hospital",
        customerArea: "Model Town",
        customerSubArea: "Block A",
        customerPrimaryContact: "+92-300-6666666",
        customerSecondaryContact: "+92-42-35222222",
        customerCnic: "35202-6789012-6",
        customerLicenseNumber: "HL-2024-006",
        customerLicenseExpiryDate: new Date("2025-07-15")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-007",
        customerName: "Rawalpindi Pharmacy",
        customerProvince: "Punjab",
        customerCity: "Rawalpindi",
        customerAddress: "Mall Road, Rawalpindi",
        customerCategory: "Pharmacy",
        customerArea: "Mall Road",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-7777777",
        customerSecondaryContact: "+92-51-53111111",
        customerCnic: "33101-7890123-7",
        customerLicenseNumber: "PH-2024-007",
        customerLicenseExpiryDate: new Date("2025-09-20")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-008",
        customerName: "Multan Medical Store",
        customerProvince: "Punjab",
        customerCity: "Multan",
        customerAddress: "Ghanta Ghar, Multan",
        customerCategory: "Retailer",
        customerArea: "Ghanta Ghar",
        customerSubArea: "Main Market",
        customerPrimaryContact: "+92-300-8888888",
        customerSecondaryContact: null,
        customerCnic: "33101-8901234-8",
        customerLicenseNumber: "RT-2024-008",
        customerLicenseExpiryDate: new Date("2025-05-10")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-009",
        customerName: "Gujranwala Hospital",
        customerProvince: "Punjab",
        customerCity: "Gujranwala",
        customerAddress: "GT Road, Gujranwala",
        customerCategory: "Hospital",
        customerArea: "GT Road",
        customerSubArea: "Medical Complex",
        customerPrimaryContact: "+92-300-9999999",
        customerSecondaryContact: "+92-55-41111111",
        customerCnic: "33101-9012345-9",
        customerLicenseNumber: "HL-2024-009",
        customerLicenseExpiryDate: new Date("2025-11-30")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-010",
        customerName: "Sialkot Pharmaceuticals",
        customerProvince: "Punjab",
        customerCity: "Sialkot",
        customerAddress: "Allama Iqbal Road, Sialkot",
        customerCategory: "Wholesaler",
        customerArea: "Allama Iqbal Road",
        customerSubArea: "Industrial Area",
        customerPrimaryContact: "+92-300-1010101",
        customerSecondaryContact: "+92-52-42111111",
        customerCnic: "33101-0123456-0",
        customerLicenseNumber: "WH-2024-010",
        customerLicenseExpiryDate: new Date("2025-02-28")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-011",
        customerName: "Bahawalpur Medical Store",
        customerProvince: "Punjab",
        customerCity: "Bahawalpur",
        customerAddress: "Model Town, Bahawalpur",
        customerCategory: "Retailer",
        customerArea: "Model Town",
        customerSubArea: "Block B",
        customerPrimaryContact: "+92-300-2020202",
        customerSecondaryContact: null,
        customerCnic: "33101-1234567-1",
        customerLicenseNumber: "RT-2024-011",
        customerLicenseExpiryDate: new Date("2025-06-15")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-012",
        customerName: "Sargodha Medical Center",
        customerProvince: "Punjab",
        customerCity: "Sargodha",
        customerAddress: "University Road, Sargodha",
        customerCategory: "Hospital",
        customerArea: "University Road",
        customerSubArea: "Academic Zone",
        customerPrimaryContact: "+92-300-3030303",
        customerSecondaryContact: "+92-48-71111111",
        customerCnic: "33101-2345678-2",
        customerLicenseNumber: "HL-2024-012",
        customerLicenseExpiryDate: new Date("2025-08-20")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-013",
        customerName: "Sheikhupura Pharmacy",
        customerProvince: "Punjab",
        customerCity: "Sheikhupura",
        customerAddress: "GT Road, Sheikhupura",
        customerCategory: "Pharmacy",
        customerArea: "GT Road",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-4040404",
        customerSecondaryContact: "+92-56-61111111",
        customerCnic: "33101-3456789-3",
        customerLicenseNumber: "PH-2024-013",
        customerLicenseExpiryDate: new Date("2025-10-25")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-014",
        customerName: "Islamabad Medical Center",
        customerProvince: "Islamabad Capital Territory",
        customerCity: "Islamabad",
        customerAddress: "Blue Area, Islamabad",
        customerCategory: "Hospital",
        customerArea: "Blue Area",
        customerSubArea: "Commercial District",
        customerPrimaryContact: "+92-300-5050505",
        customerSecondaryContact: "+92-51-91111111",
        customerCnic: "33101-4567890-4",
        customerLicenseNumber: "HL-2024-014",
        customerLicenseExpiryDate: new Date("2025-12-05")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-015",
        customerName: "Mardan Hospital",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Mardan",
        customerAddress: "GT Road, Mardan",
        customerCategory: "Hospital",
        customerArea: "GT Road",
        customerSubArea: "Medical Complex",
        customerPrimaryContact: "+92-300-6060606",
        customerSecondaryContact: "+92-937-1111111",
        customerCnic: "33101-5678901-5",
        customerLicenseNumber: "HL-2024-015",
        customerLicenseExpiryDate: new Date("2025-04-12")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-016",
        customerName: "Mingora Medical Store",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Mingora",
        customerAddress: "Main Bazar, Mingora",
        customerCategory: "Retailer",
        customerArea: "Main Bazar",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-7070707",
        customerSecondaryContact: null,
        customerCnic: "33101-6789012-6",
        customerLicenseNumber: "RT-2024-016",
        customerLicenseExpiryDate: new Date("2025-07-18")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-017",
        customerName: "Kohat Pharmacy",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Kohat",
        customerAddress: "GT Road, Kohat",
        customerCategory: "Pharmacy",
        customerArea: "GT Road",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-8080808",
        customerSecondaryContact: "+92-922-1111111",
        customerCnic: "33101-7890123-7",
        customerLicenseNumber: "PH-2024-017",
        customerLicenseExpiryDate: new Date("2025-09-30")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-018",
        customerName: "Dera Ismail Khan Hospital",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Dera Ismail Khan",
        customerAddress: "GT Road, Dera Ismail Khan",
        customerCategory: "Hospital",
        customerArea: "GT Road",
        customerSubArea: "Medical District",
        customerPrimaryContact: "+92-300-9090909",
        customerSecondaryContact: "+92-964-1111111",
        customerCnic: "33101-8901234-8",
        customerLicenseNumber: "HL-2024-018",
        customerLicenseExpiryDate: new Date("2025-05-22")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-019",
        customerName: "Bannu Medical Center",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Bannu",
        customerAddress: "GT Road, Bannu",
        customerCategory: "Hospital",
        customerArea: "GT Road",
        customerSubArea: "Medical Complex",
        customerPrimaryContact: "+92-300-1111112",
        customerSecondaryContact: "+92-928-1111111",
        customerCnic: "33101-9012345-9",
        customerLicenseNumber: "HL-2024-019",
        customerLicenseExpiryDate: new Date("2025-11-08")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-020",
        customerName: "Abbottabad Hospital",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Abbottabad",
        customerAddress: "Mansehra Road, Abbottabad",
        customerCategory: "Hospital",
        customerArea: "Mansehra Road",
        customerSubArea: "Medical Complex",
        customerPrimaryContact: "+92-300-2222223",
        customerSecondaryContact: "+92-992-1111111",
        customerCnic: "33101-0123456-0",
        customerLicenseNumber: "HL-2024-020",
        customerLicenseExpiryDate: new Date("2025-03-15")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-021",
        customerName: "Swat Pharmacy",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Swat",
        customerAddress: "Main Bazar, Swat",
        customerCategory: "Pharmacy",
        customerArea: "Main Bazar",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-3333334",
        customerSecondaryContact: "+92-946-1111111",
        customerCnic: "33101-1234567-1",
        customerLicenseNumber: "PH-2024-021",
        customerLicenseExpiryDate: new Date("2025-06-28")
      },
      {
        vendorId: saadVendor._id,
        customerCode: "SAAD-022",
        customerName: "Chitral Medical Store",
        customerProvince: "Khyber Pakhtunkhwa",
        customerCity: "Chitral",
        customerAddress: "Main Bazar, Chitral",
        customerCategory: "Retailer",
        customerArea: "Main Bazar",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-4444445",
        customerSecondaryContact: null,
        customerCnic: "33101-2345678-2",
        customerLicenseNumber: "RT-2024-022",
        customerLicenseExpiryDate: new Date("2025-08-14")
      }
    ];

    await UserCustomers.insertMany(saadCustomers);
    console.log(`${saadCustomers.length} customers created for Saad`);
  } else {
    console.log("Customers for Saad already exist");
  }

  // Create 5 customers for Yasir
  if (!existingYasirCustomers) {
    const yasirCustomers = [
      {
        vendorId: yasirVendor._id,
        customerCode: "YASIR-001",
        customerName: "Karachi Central Hospital",
        customerProvince: "Sindh",
        customerCity: "Karachi",
        customerAddress: "Clifton, Karachi",
        customerCategory: "Hospital",
        customerArea: "Clifton",
        customerSubArea: "Block 4",
        customerPrimaryContact: "+92-300-5555556",
        customerSecondaryContact: "+92-21-35811111",
        customerCnic: "42101-5678901-6",
        customerLicenseNumber: "HL-2024-023",
        customerLicenseExpiryDate: new Date("2025-09-15")
      },
      {
        vendorId: yasirVendor._id,
        customerCode: "YASIR-002",
        customerName: "Hyderabad Medical Store",
        customerProvince: "Sindh",
        customerCity: "Hyderabad",
        customerAddress: "Saddar, Hyderabad",
        customerCategory: "Retailer",
        customerArea: "Saddar",
        customerSubArea: "Main Market",
        customerPrimaryContact: "+92-300-6666667",
        customerSecondaryContact: null,
        customerCnic: "42101-6789012-7",
        customerLicenseNumber: "RT-2024-024",
        customerLicenseExpiryDate: new Date("2025-11-20")
      },
      {
        vendorId: yasirVendor._id,
        customerCode: "YASIR-003",
        customerName: "Sukkur Pharmacy",
        customerProvince: "Sindh",
        customerCity: "Sukkur",
        customerAddress: "Military Road, Sukkur",
        customerCategory: "Pharmacy",
        customerArea: "Military Road",
        customerSubArea: null,
        customerPrimaryContact: "+92-300-7777778",
        customerSecondaryContact: "+92-71-56111111",
        customerCnic: "42101-7890123-8",
        customerLicenseNumber: "PH-2024-025",
        customerLicenseExpiryDate: new Date("2025-07-10")
      },
      {
        vendorId: yasirVendor._id,
        customerCode: "YASIR-004",
        customerName: "Larkana Hospital",
        customerProvince: "Sindh",
        customerCity: "Larkana",
        customerAddress: "Station Road, Larkana",
        customerCategory: "Hospital",
        customerArea: "Station Road",
        customerSubArea: "Medical Complex",
        customerPrimaryContact: "+92-300-8888889",
        customerSecondaryContact: "+92-74-41111111",
        customerCnic: "42101-8901234-9",
        customerLicenseNumber: "HL-2024-026",
        customerLicenseExpiryDate: new Date("2025-12-05")
      },
      {
        vendorId: yasirVendor._id,
        customerCode: "YASIR-005",
        customerName: "Mirpurkhas Medical Center",
        customerProvince: "Sindh",
        customerCity: "Mirpurkhas",
        customerAddress: "Hyderabad Road, Mirpurkhas",
        customerCategory: "Hospital",
        customerArea: "Hyderabad Road",
        customerSubArea: "Medical District",
        customerPrimaryContact: "+92-300-9999990",
        customerSecondaryContact: "+92-233-61111111",
        customerCnic: "42101-9012345-0",
        customerLicenseNumber: "HL-2024-027",
        customerLicenseExpiryDate: new Date("2025-05-18")
      }
    ];

    await UserCustomers.insertMany(yasirCustomers);
    console.log(`${yasirCustomers.length} customers created for Yasir`);
  } else {
    console.log("Customers for Yasir already exist");
  }

  console.log("Seeding completed for both vendors");
  process.exit();
};

seedUserCustomers().catch((err) => {
  console.error(err);
  process.exit(1);
}); 