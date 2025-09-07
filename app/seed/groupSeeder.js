const Group = require('../models/groupModel');
const Brand = require('../models/brandModel');
const User = require('../models/userModel');

const groupSeeder = async () => {
  try {
    // Check if groups already exist
    const existingGroups = await Group.countDocuments();
    if (existingGroups > 0) {
      console.log('Groups already exist. Skipping seeding.');
      return;
    }

    // Get all vendors and brands for seeding
    const vendors = await User.find({ userType: 'Vendor' }).limit(5);
    const brands = await Brand.find().limit(10);

    if (vendors.length === 0 || brands.length === 0) {
      console.log('No vendors or brands found. Please seed vendors and brands first.');
      return;
    }

    const sampleGroups = [
      // Pharmaceutical Groups
      'Antibiotics',
      'Analgesics', 
      'Cardiovascular',
      'Antidiabetics',
      'Respiratory',
      'Gastrointestinal',
      'Neurological',
      'Vitamins',
      'Topical',
      'Vaccines'
    ];

    const groupsToCreate = [];

    // Create groups for each vendor-brand combination
    for (const vendor of vendors) {
      const vendorBrands = brands.filter(brand => brand.vendorId.toString() === vendor._id.toString());
      
      if (vendorBrands.length === 0) {
        // If no brands for this vendor, use first few brands
        vendorBrands.push(...brands.slice(0, 2));
      }

      for (const brand of vendorBrands.slice(0, 3)) { // Limit to 3 brands per vendor
        // Add random groups for each brand (3-5 groups per brand)
        const numGroups = Math.floor(Math.random() * 3) + 3; // 3-5 groups
        const selectedGroups = sampleGroups
          .sort(() => 0.5 - Math.random())
          .slice(0, numGroups);

        for (const groupName of selectedGroups) {
          groupsToCreate.push({
            vendorId: vendor._id,
            brandId: brand._id,
            groupName: groupName,
            isActive: Math.random() > 0.1 // 90% active
          });
        }
      }
    }

    // Remove duplicates based on vendorId, brandId, and groupName
    const uniqueGroups = [];
    const seen = new Set();

    for (const group of groupsToCreate) {
      const key = `${group.vendorId}-${group.brandId}-${group.groupName}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueGroups.push(group);
      }
    }

    if (uniqueGroups.length > 0) {
      await Group.insertMany(uniqueGroups);
      console.log(`Successfully seeded ${uniqueGroups.length} groups.`);
    } else {
      console.log('No groups to seed.');
    }

  } catch (error) {
    console.error('Error seeding groups:', error);
    throw error;
  }
};

module.exports = groupSeeder;
