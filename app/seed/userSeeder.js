require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const seedUser = async () => {
  await mongoose.connect(process.env.MONGO_URI);  

  // Check if the default user already exists
  const existing = await User.findOne({ email: "yasirjamil460@gmail.com" });
  if (existing) {
    console.log("Default user already exists");
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const user = new User({
    name: "Admin",
    email: "yasirjamil460@gmail.com",
    password: hashedPassword,
  });

  await user.save();
  console.log("Default user created");
  process.exit();
};

seedUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
