const SubGroup = require('../models/subGroupModel');
const Group = require('../models/groupModel');
const User = require('../models/userModel');

const subGroupSeeder = async () => {
  try {
    // Check if sub groups already exist
    const existingSubGroups = await SubGroup.countDocuments();
    if (existingSubGroups > 0) {
      console.log('Sub groups already exist. Skipping seeding.');
      return;
    }

    // Get all groups for seeding
    const groups = await Group.find().populate('vendorId brandId');

    if (groups.length === 0) {
      console.log('No groups found. Please seed groups first.');
      return;
    }

    const subGroupsByGroup = {
      'Antibiotics': ['Penicillin', 'Cephalosporin', 'Macrolides', 'Fluoroquinolones'],
      'Analgesics': ['NSAIDs', 'Opioids', 'Acetaminophen'],
      'Cardiovascular': ['ACE Inhibitors', 'Beta Blockers', 'Calcium Channel Blockers', 'Diuretics'],
      'Antidiabetics': ['Insulin', 'Metformin', 'Sulfonylureas'],
      'Respiratory': ['Bronchodilators', 'Corticosteroids', 'Antihistamines'],
      'Gastrointestinal': ['Proton Pump Inhibitors', 'Antacids', 'Anti-diarrheal'],
      'Neurological': ['Antiepileptics', 'Antidepressants', 'Anxiolytics'],
      'Vitamins': ['Vitamin D', 'Vitamin B Complex', 'Multivitamins'],
      'Topical': ['Antifungal Creams', 'Antiseptic Solutions', 'Pain Relief Gels'],
      'Vaccines': ['Hepatitis', 'Influenza', 'COVID-19']
    };

    const subGroupsToCreate = [];

    // Create sub groups for each group
    for (const group of groups) {
      const subGroupNames = subGroupsByGroup[group.groupName] || ['Sub Group 1', 'Sub Group 2', 'Sub Group 3'];
      
      // Create 2-4 sub groups per group
      const numSubGroups = Math.floor(Math.random() * 3) + 2; // 2-4 sub groups
      const selectedSubGroups = subGroupNames
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(numSubGroups, subGroupNames.length));

      for (const subGroupName of selectedSubGroups) {
        subGroupsToCreate.push({
          vendorId: group.vendorId._id,
          groupId: group._id,
          subGroupName: subGroupName,
          isActive: Math.random() > 0.1 // 90% active
        });
      }
    }

    // Remove duplicates based on vendorId, groupId, and subGroupName
    const uniqueSubGroups = [];
    const seen = new Set();

    for (const subGroup of subGroupsToCreate) {
      const key = `${subGroup.vendorId}-${subGroup.groupId}-${subGroup.subGroupName}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSubGroups.push(subGroup);
      }
    }

    if (uniqueSubGroups.length > 0) {
      await SubGroup.insertMany(uniqueSubGroups);
      console.log(`Successfully seeded ${uniqueSubGroups.length} sub groups.`);
    } else {
      console.log('No sub groups to seed.');
    }

  } catch (error) {
    console.error('Error seeding sub groups:', error);
    throw error;
  }
};

module.exports = subGroupSeeder;
