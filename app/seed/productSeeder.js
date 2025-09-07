const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const Group = require('../models/groupModel');
const SubGroup = require('../models/subGroupModel');
const User = require('../models/userModel');

const productSeeder = async () => {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('Products already exist. Skipping seeding.');
      return;
    }

    // Get all vendors, brands, groups, and subgroups for seeding
    const vendors = await User.find({ vendorRole: 'vendor' }).limit(5);
    const brands = await Brand.find().limit(10);
    const groups = await Group.find().limit(20);
    const subGroups = await SubGroup.find().limit(50);

    if (vendors.length === 0 || brands.length === 0 || groups.length === 0 || subGroups.length === 0) {
      console.log('No vendors, brands, groups, or subgroups found. Please seed them first.');
      return;
    }

    const sampleProducts = [
      // Antibiotics - Penicillin
      { 
        productName: 'Amoxicillin Capsules',
        packingSize: '500mg x 20 capsules',
        cartonSize: '10 strips x 20 boxes'
      },
      { 
        productName: 'Ampicillin Injection',
        packingSize: '1g vial',
        cartonSize: '10 vials x 5 boxes'
      },
      
      // Antibiotics - Cephalosporin
      { 
        productName: 'Cefixime Tablets',
        packingSize: '200mg x 10 tablets',
        cartonSize: '10 strips x 20 boxes'
      },
      { 
        productName: 'Ceftriaxone Injection',
        packingSize: '1g vial',
        cartonSize: '10 vials x 5 boxes'
      },
      
      // Analgesics - NSAIDs
      { 
        productName: 'Ibuprofen Tablets',
        packingSize: '400mg x 20 tablets',
        cartonSize: '10 strips x 30 boxes'
      },
      { 
        productName: 'Diclofenac Gel',
        packingSize: '30g tube',
        cartonSize: '20 tubes x 10 boxes'
      },
      
      // Cardiovascular - ACE Inhibitors
      { 
        productName: 'Enalapril Tablets',
        packingSize: '5mg x 30 tablets',
        cartonSize: '10 strips x 20 boxes'
      },
      { 
        productName: 'Lisinopril Tablets',
        packingSize: '10mg x 30 tablets',
        cartonSize: '10 strips x 20 boxes'
      },
      
      // Antidiabetics - Insulin
      { 
        productName: 'Human Insulin',
        packingSize: '100IU/ml x 10ml vial',
        cartonSize: '10 vials x 5 boxes'
      },
      { 
        productName: 'Insulin Glargine',
        packingSize: '100IU/ml x 3ml pen',
        cartonSize: '5 pens x 10 boxes'
      },
      
      // Respiratory - Bronchodilators
      { 
        productName: 'Salbutamol Inhaler',
        packingSize: '100mcg x 200 doses',
        cartonSize: '10 inhalers x 5 boxes'
      },
      { 
        productName: 'Theophylline Tablets',
        packingSize: '300mg x 30 tablets',
        cartonSize: '10 strips x 15 boxes'
      },
      
      // Gastrointestinal - Proton Pump Inhibitors
      { 
        productName: 'Omeprazole Capsules',
        packingSize: '20mg x 30 capsules',
        cartonSize: '10 strips x 20 boxes'
      },
      { 
        productName: 'Pantoprazole Tablets',
        packingSize: '40mg x 15 tablets',
        cartonSize: '10 strips x 25 boxes'
      },
      
      // Additional products for variety
      { 
        productName: 'Paracetamol Syrup',
        packingSize: '120mg/5ml x 60ml bottle',
        cartonSize: '20 bottles x 10 boxes'
      },
      { 
        productName: 'Vitamin B Complex',
        packingSize: '30 tablets',
        cartonSize: '10 strips x 30 boxes'
      }
    ];

    const productsToInsert = [];

    // Create products for each vendor-brand-group-subgroup combination
    for (const vendor of vendors) {
      for (const brand of brands.filter(b => b.vendorId.toString() === vendor._id.toString())) {
        for (const group of groups.filter(g => g.vendorId.toString() === vendor._id.toString() && g.brandId.toString() === brand._id.toString())) {
          for (const subGroup of subGroups.filter(sg => sg.vendorId.toString() === vendor._id.toString() && sg.groupId.toString() === group._id.toString())) {
            // Add 1-2 products per subgroup
            const productCount = Math.floor(Math.random() * 2) + 1;
            
            for (let i = 0; i < productCount && i < sampleProducts.length; i++) {
              const sampleProduct = sampleProducts[(productsToInsert.length + i) % sampleProducts.length];
              
              // Create unique product name by adding subgroup reference
              const uniqueProductName = `${sampleProduct.productName} - ${subGroup.subGroupName}`;
              
              // Check if this exact combination already exists
              const existingProduct = await Product.findOne({
                vendorId: vendor._id,
                brandId: brand._id,
                groupId: group._id,
                subGroupId: subGroup._id,
                productName: uniqueProductName
              });

              if (!existingProduct) {
                productsToInsert.push({
                  vendorId: vendor._id,
                  brandId: brand._id,
                  groupId: group._id,
                  subGroupId: subGroup._id,
                  productName: uniqueProductName,
                  packingSize: sampleProduct.packingSize,
                  cartonSize: sampleProduct.cartonSize,
                  isActive: Math.random() > 0.1 // 90% chance of being active
                });
              }
            }
          }
        }
      }
    }

    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
      console.log(`${productsToInsert.length} products seeded successfully!`);
    } else {
      console.log('No new products to seed.');
    }

  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};

module.exports = productSeeder;
