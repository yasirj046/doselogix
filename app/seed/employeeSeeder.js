const Employee = require("../models/employeeModel");
const User = require("../models/userModel");
const { DESIGNATIONS } = require("../constants/designations");

const seedEmployees = async () => {
  try {
    // Clear existing employees
    await Employee.deleteMany({});
    console.log("Existing employees cleared");

    // Get all vendors
    const vendors = await User.find({});
    
    if (vendors.length === 0) {
      console.log("No vendors found. Please seed users first.");
      return;
    }

    const employeesData = [];

    // Create sample employees for each vendor
    vendors.forEach((vendor, vendorIndex) => {
      const sampleEmployees = [
        {
          vendorId: vendor._id,
          employeeName: "Ahmed Hassan",
          city: "Lahore",
          address: "Block A, Gulberg III, Lahore",
          primaryContact: "03001234567",
          secondaryContact: "03119876543",
          cnic: "35202-1234567-1",
          referencePerson: "Muhammad Ali",
          referencePersonContact: "03001111111",
          referencePersonAddress: "Block B, Gulberg II, Lahore",
          salary: 45000,
          designation: DESIGNATIONS.MANAGER,
          isActive: true
        },
        {
          vendorId: vendor._id,
          employeeName: "Fatima Khan",
          city: "Karachi",
          address: "House 123, DHA Phase 5, Karachi",
          primaryContact: "03212345678",
          secondaryContact: "03330987654",
          cnic: "42101-2345678-2",
          referencePerson: "Sarah Ahmed",
          referencePersonContact: "03212222222",
          referencePersonAddress: "Flat 456, Clifton Block 7, Karachi",
          salary: 35000,
          designation: DESIGNATIONS.SALESMAN,
          isActive: true
        },
        {
          vendorId: vendor._id,
          employeeName: "Muhammad Usman",
          city: "Islamabad",
          address: "Street 5, Sector G-9, Islamabad",
          primaryContact: "03453456789",
          cnic: "61101-3456789-3",
          referencePerson: "Hassan Ali",
          referencePersonContact: "03453333333",
          referencePersonAddress: "Street 10, Sector F-8, Islamabad",
          salary: 25000,
          designation: DESIGNATIONS.DRIVER,
          isActive: true
        },
        {
          vendorId: vendor._id,
          employeeName: "Aisha Malik",
          city: "Faisalabad",
          address: "Civil Lines, Faisalabad",
          primaryContact: "03564567890",
          secondaryContact: "03421098765",
          cnic: "33202-4567890-4",
          referencePerson: "Zara Khan",
          referencePersonContact: "03564444444",
          referencePersonAddress: "Peoples Colony, Faisalabad",
          salary: 20000,
          designation: DESIGNATIONS.WORKER,
          isActive: true
        },
        {
          vendorId: vendor._id,
          employeeName: "Ali Raza",
          city: "Multan",
          address: "Cantt Area, Multan",
          primaryContact: "03675678901",
          cnic: "36302-5678901-5",
          referencePerson: "Omar Sheikh",
          referencePersonContact: "03675555555",
          referencePersonAddress: "Gulgasht Colony, Multan",
          salary: 30000,
          designation: DESIGNATIONS.SUPERVISOR,
          isActive: false
        }
      ];

      // Modify CNIC for each vendor to avoid duplicates
      sampleEmployees.forEach((emp, index) => {
        const cnicBase = emp.cnic.split('-');
        cnicBase[1] = (parseInt(cnicBase[1]) + vendorIndex * 1000 + index).toString().padStart(7, '0');
        emp.cnic = cnicBase.join('-');
      });

      employeesData.push(...sampleEmployees);
    });

    // Insert employees
    const insertedEmployees = await Employee.insertMany(employeesData);
    console.log(`${insertedEmployees.length} employees seeded successfully`);

    return insertedEmployees;
  } catch (error) {
    console.error("Error seeding employees:", error);
    throw error;
  }
};

module.exports = seedEmployees;
