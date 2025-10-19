const Expense = require('../models/expenseModel');
const User = require('../models/userModel');
const { EXPENSE_CATEGORY_ENUM } = require('../constants/expenseCategories');

const seedExpenses = async () => {
  try {
    // Check if expenses already exist
    const existingExpenses = await Expense.countDocuments();
    if (existingExpenses > 0) {
      console.log('Expenses already exist, skipping seeding...');
      return;
    }

    // Get all vendors
    const vendors = await User.find({ role: 'vendor' }).limit(5);
    if (vendors.length === 0) {
      console.log('No vendors found, skipping expense seeding...');
      return;
    }

    const expenseCategories = EXPENSE_CATEGORY_ENUM;

    const sampleDescriptions = {
      'Office Supplies': [
        'Purchase of stationery items',
        'Printer paper and ink cartridges',
        'Office cleaning supplies',
        'Desk organizers and folders'
      ],
      'Utilities': [
        'Monthly electricity bill',
        'Internet and phone services',
        'Water and sewerage charges',
        'Gas utility bill'
      ],
      'Transportation': [
        'Fuel for delivery vehicles',
        'Vehicle maintenance and repairs',
        'Public transport for staff',
        'Taxi fare for business meetings'
      ],
      'Marketing': [
        'Social media advertising',
        'Print advertisement in local newspaper',
        'Business brochures and flyers',
        'Website development and maintenance'
      ],
      'Travel': [
        'Business trip to supplier',
        'Hotel accommodation for conference',
        'Flight tickets for trade show',
        'Meals during business travel'
      ],
      'Equipment': [
        'New laptop for accounting',
        'Purchase of weighing scale',
        'Office furniture - desk and chairs',
        'Security camera installation'
      ],
      'Maintenance': [
        'Building maintenance and repairs',
        'HVAC system servicing',
        'Equipment calibration and servicing',
        'Pest control services'
      ],
      'Insurance': [
        'Business liability insurance',
        'Vehicle insurance premium',
        'Property insurance renewal',
        'Worker compensation insurance'
      ],
      'Professional Services': [
        'Legal consultation fees',
        'Accounting and tax services',
        'Business consultant fees',
        'Auditing services'
      ],
      'Communication': [
        'Mobile phone bills',
        'Landline and internet charges',
        'Postal and courier services',
        'Video conferencing software subscription'
      ],
      'Training': [
        'Staff training program',
        'Professional development course',
        'Safety training and certification',
        'Software training sessions'
      ],
      'Entertainment': [
        'Client dinner meeting',
        'Team building activities',
        'Business lunch with partners',
        'Office celebration expenses'
      ],
      'Rent': [
        'Monthly office rent',
        'Warehouse rental fee',
        'Parking space rental',
        'Equipment rental charges'
      ],
      'Miscellaneous': [
        'Bank charges and fees',
        'License and permit renewals',
        'Donations and charitable contributions',
        'Emergency repairs and supplies'
      ]
    };

    const expenses = [];

    // Create expenses for each vendor
    for (const vendor of vendors) {
      // Generate 15-25 expenses per vendor
      const numberOfExpenses = Math.floor(Math.random() * 11) + 15;
      
      for (let i = 0; i < numberOfExpenses; i++) {
        const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const descriptions = sampleDescriptions[category];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        // Generate random date within last 6 months
        const currentDate = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
        
        const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (currentDate.getTime() - sixMonthsAgo.getTime()));
        
        // Generate random amount based on category
        let amount;
        switch (category) {
          case 'Rent':
          case 'Insurance':
            amount = Math.floor(Math.random() * 3000) + 1000; // 1000-4000
            break;
          case 'Equipment':
          case 'Professional Services':
            amount = Math.floor(Math.random() * 2000) + 500; // 500-2500
            break;
          case 'Utilities':
          case 'Marketing':
          case 'Travel':
            amount = Math.floor(Math.random() * 1000) + 200; // 200-1200
            break;
          case 'Transportation':
          case 'Maintenance':
          case 'Training':
            amount = Math.floor(Math.random() * 800) + 100; // 100-900
            break;
          default:
            amount = Math.floor(Math.random() * 500) + 50; // 50-550
        }
        
        // Add decimal places randomly
        if (Math.random() > 0.7) {
          amount += Math.floor(Math.random() * 99) / 100;
        }

        expenses.push({
          vendorId: vendor._id,
          date: randomDate,
          expenseCategory: category,
          description: description,
          amount: parseFloat(amount.toFixed(2)),
          isActive: Math.random() > 0.1 // 90% active, 10% inactive
        });
      }
    }

    // Insert all expenses
    const createdExpenses = await Expense.insertMany(expenses);
    console.log(`✅ Successfully created ${createdExpenses.length} sample expenses`);
    
    // Print summary by category
    const summary = {};
    expenses.forEach(expense => {
      if (!summary[expense.expenseCategory]) {
        summary[expense.expenseCategory] = { count: 0, totalAmount: 0 };
      }
      summary[expense.expenseCategory].count++;
      summary[expense.expenseCategory].totalAmount += expense.amount;
    });
    
    console.log('\n📊 Expense Summary by Category:');
    Object.entries(summary).forEach(([category, data]) => {
      console.log(`   ${category}: ${data.count} expenses, Total: $${data.totalAmount.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding expenses:', error);
    throw error;
  }
};

module.exports = seedExpenses;
