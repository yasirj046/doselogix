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
      { group: 'Antibiotics', subGroup: 'Penicillin' },
      { group: 'Antibiotics', subGroup: 'Cephalosporin' },
      { group: 'Antibiotics', subGroup: 'Macrolides' },
      { group: 'Antibiotics', subGroup: 'Fluoroquinolones' },
      
      { group: 'Analgesics', subGroup: 'NSAIDs' },
      { group: 'Analgesics', subGroup: 'Opioids' },
      { group: 'Analgesics', subGroup: 'Acetaminophen' },
      
      { group: 'Cardiovascular', subGroup: 'ACE Inhibitors' },
      { group: 'Cardiovascular', subGroup: 'Beta Blockers' },
      { group: 'Cardiovascular', subGroup: 'Calcium Channel Blockers' },
      { group: 'Cardiovascular', subGroup: 'Diuretics' },
      
      { group: 'Antidiabetics', subGroup: 'Insulin' },
      { group: 'Antidiabetics', subGroup: 'Metformin' },
      { group: 'Antidiabetics', subGroup: 'Sulfonylureas' },
      
      { group: 'Respiratory', subGroup: 'Bronchodilators' },
      { group: 'Respiratory', subGroup: 'Corticosteroids' },
      { group: 'Respiratory', subGroup: 'Antihistamines' },
      
      { group: 'Gastrointestinal', subGroup: 'Proton Pump Inhibitors' },
      { group: 'Gastrointestinal', subGroup: 'Antacids' },
      { group: 'Gastrointestinal', subGroup: 'Anti-diarrheal' },
      
      { group: 'Neurological', subGroup: 'Antiepileptics' },
      { group: 'Neurological', subGroup: 'Antidepressants' },
      { group: 'Neurological', subGroup: 'Anxiolytics' },
      
      { group: 'Vitamins', subGroup: 'Vitamin D' },
      { group: 'Vitamins', subGroup: 'Vitamin B Complex' },
      { group: 'Vitamins', subGroup: 'Multivitamins' },
      
      { group: 'Topical', subGroup: 'Antifungal Creams' },
      { group: 'Topical', subGroup: 'Antiseptic Solutions' },
      { group: 'Topical', subGroup: 'Pain Relief Gels' },
      
      { group: 'Vaccines', subGroup: 'Hepatitis' },
      { group: 'Vaccines', subGroup: 'Influenza' },
      { group: 'Vaccines', subGroup: 'COVID-19' }
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
        // Add random groups for each brand (5-8 groups per brand)
        const numGroups = Math.floor(Math.random() * 4) + 5; // 5-8 groups
        const selectedGroups = sampleGroups
          .sort(() => 0.5 - Math.random())
          .slice(0, numGroups);

        for (const groupData of selectedGroups) {
          groupsToCreate.push({
            vendorId: vendor._id,
            brandId: brand._id,
            group: groupData.group,
            subGroup: groupData.subGroup,
            isActive: Math.random() > 0.1 // 90% active
          });
        }
      }
    }

    // Remove duplicates based on vendorId, brandId, group, and subGroup
    const uniqueGroups = [];
    const seen = new Set();

    for (const group of groupsToCreate) {
      const key = `${group.vendorId}-${group.brandId}-${group.group}-${group.subGroup}`;
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
