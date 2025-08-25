const dotenv = require('dotenv');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

dotenv.config();

const seedUser = async () => {
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

  // Check if the default vendors already exist
  const existingSaad = await User.findOne({ vendorEmail: "saad05858@gmail.com" });
  const existingYasir = await User.findOne({ vendorEmail: "yasirjamil460@gmail.com" });
  
  if (existingSaad && existingYasir) {
    console.log("Both default vendors already exist");
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash("Linkin@420", 10);

  // Create first vendor (Saad Aslam)
  if (!existingSaad) {
    const vendor1 = new User({
      vendorName: "Saad Aslam",
      vendorEmail: "saad05858@gmail.com",
      vendorPassword: hashedPassword,
      vendorPhone: "+92-309-9084294",
      vendorAddress: "123 Main Street, Lahore",
      businessName: "Admin Pharmaceuticals",
      businessLicenseNumber: "BL-2024-001",
      businessLicenseExpiryDate: new Date("2025-12-31"),
      businessLicenseIssueDate: new Date("2024-01-01"),
      businessLicenseAuthority: "Punjab Health Department",
      vendorRole: "admin"
    });

    await vendor1.save();
    console.log("First vendor (Saad Aslam) created");
  } else {
    console.log("First vendor (Saad Aslam) already exists");
  }

  // Create second vendor (Yasir Jamil)
  if (!existingYasir) {
    const vendor2 = new User({
      vendorName: "Yasir Jamil",
      vendorEmail: "yasirjamil460@gmail.com",
      vendorPassword: hashedPassword,
      vendorPhone: "+92-300-0000000",
      vendorAddress: "456 Business Avenue, Karachi",
      businessName: "Yasir Pharmaceuticals",
      businessLicenseNumber: "BL-2024-002",
      businessLicenseExpiryDate: new Date("2025-12-31"),
      businessLicenseIssueDate: new Date("2024-01-01"),
      businessLicenseAuthority: "Sindh Health Department",
      vendorRole: "admin"
    });

    await vendor2.save();
    console.log("Second vendor (Yasir Jamil) created");
  } else {
    console.log("Second vendor (Yasir Jamil) already exists");
  }

  console.log("Seeding completed");
  process.exit();
};

seedUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
