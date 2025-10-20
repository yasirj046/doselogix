const Brand = require('../models/brandModel');
const Area = require('../models/areaModel');
const SubArea = require('../models/subAreaModel');
const Group = require('../models/groupModel');
const SubGroup = require('../models/subGroupModel');
const Product = require('../models/productModel');
const UserCustomer = require('../models/userCustomersModel');
const Employee = require('../models/employeeModel');
const Expense = require('../models/expenseModel');
const SalesInvoice = require('../models/salesInvoiceModel');
const PurchaseEntry = require('../models/purchaseEntryModel');
const LedgerTransaction = require('../models/ledgerTransactionModel');
const LedgerSnapshot = require('../models/ledgerSnapshotModel');
const Inventory = require('../models/inventoryModel');
const SalesProduct = require('../models/salesProductModel');
const PurchaseProduct = require('../models/purchaseProductModel');
const LedgerService = require('./ledgerService');
const { PROVINCE_ENUM } = require('../constants/provinces');
const { ALL_CITIES } = require('../constants/cities');
const { CUSTOMER_CATEGORY_ENUM } = require('../constants/customerCategories');
const { DESIGNATION_ENUM } = require('../constants/designations');
const { EXPENSE_CATEGORY_ENUM } = require('../constants/expenseCategories');

class SeedService {
  /**
   * Delete all data for a vendor
   */
  static async deleteAllVendorData(vendorId) {
    try {
      console.log(`🗑️  Deleting all data for vendor: ${vendorId}`);
      
      // Delete in reverse dependency order
      await Promise.all([
        LedgerSnapshot.deleteMany({ vendorId }),
        LedgerTransaction.deleteMany({ vendorId }),
        SalesProduct.deleteMany({ vendorId }),
        PurchaseProduct.deleteMany({ vendorId }),
        Inventory.deleteMany({ vendorId }),
        SalesInvoice.deleteMany({ vendorId }),
        PurchaseEntry.deleteMany({ vendorId }),
        Expense.deleteMany({ vendorId }),
        Product.deleteMany({ vendorId }),
        SubGroup.deleteMany({ vendorId }),
        Group.deleteMany({ vendorId }),
        SubArea.deleteMany({ vendorId }),
        Area.deleteMany({ vendorId }),
        UserCustomer.deleteMany({ vendorId }),
        Employee.deleteMany({ vendorId }),
        Brand.deleteMany({ vendorId })
      ]);
      
      console.log(`✅ All data deleted for vendor: ${vendorId}`);
    } catch (error) {
      console.error('Error deleting vendor data:', error);
      throw error;
    }
  }

  /**
   * Create master data only (no transactions)
   */
  static async createMasterData(vendorId) {
    try {
      console.log(`📊 Creating master data for vendor: ${vendorId}`);
      
      // 1. Create Brands
      const brands = await this.createBrands(vendorId);
      console.log(`✅ Created ${brands.length} brands`);
      
      // 2. Create Areas and Sub-Areas
      const areas = await this.createAreas(vendorId);
      console.log(`✅ Created ${areas.length} areas`);
      
      const subAreas = await this.createSubAreas(vendorId, areas);
      console.log(`✅ Created ${subAreas.length} sub-areas`);
      
      // 3. Create Groups and Sub-Groups
      const groups = await this.createGroups(vendorId, brands);
      console.log(`✅ Created ${groups.length} groups`);
      
      const subGroups = await this.createSubGroups(vendorId, groups);
      console.log(`✅ Created ${subGroups.length} sub-groups`);
      
      // 4. Create Products
      const products = await this.createProducts(vendorId, brands, groups, subGroups);
      console.log(`✅ Created ${products.length} products`);
      
      // 5. Create Customers
      const customers = await this.createCustomers(vendorId);
      console.log(`✅ Created ${customers.length} customers`);
      
      // 6. Create Employees
      const employees = await this.createEmployees(vendorId);
      console.log(`✅ Created ${employees.length} employees`);
      
      return {
        success: true,
        message: 'Master data created successfully',
        data: {
          brands: brands.length,
          areas: areas.length,
          subAreas: subAreas.length,
          groups: groups.length,
          subGroups: subGroups.length,
          products: products.length,
          customers: customers.length,
          employees: employees.length
        }
      };
    } catch (error) {
      console.error('Error creating master data:', error);
      throw error;
    }
  }

  /**
   * Create master data with transactions
   */
  static async createMasterDataWithTransactions(vendorId) {
    try {
      console.log(`📊 Creating master data with transactions for vendor: ${vendorId}`);
      
      // First create all master data
      const masterResult = await this.createMasterData(vendorId);
      
      // Then create transactions
      const transactionResult = await this.createTransactions(vendorId);
      
      return {
        success: true,
        message: 'Master data with transactions created successfully',
        data: {
          ...masterResult.data,
          ...transactionResult.data
        }
      };
    } catch (error) {
      console.error('Error creating master data with transactions:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive test data WITHOUT ledger transactions (for sync testing)
   */
  static async createComprehensiveTestData(vendorId) {
    try {
      console.log(`🧪 Creating comprehensive test data for vendor: ${vendorId}`);
      
      // First create all master data
      const masterResult = await this.createMasterData(vendorId);
      
      // Then create comprehensive transactions WITHOUT ledger entries
      const transactionResult = await this.createComprehensiveTransactions(vendorId);
      
      return {
        success: true,
        message: 'Comprehensive test data created successfully (no ledger transactions - ready for sync)',
        data: {
          ...masterResult.data,
          ...transactionResult.data
        }
      };
    } catch (error) {
      console.error('Error creating comprehensive test data:', error);
      throw error;
    }
  }

  /**
   * Create brands
   */
  static async createBrands(vendorId) {
    const brandsData = [
      {
        vendorId,
        brandName: 'Pfizer Pharmaceuticals',
        address: '123 Medical District, Karachi',
        primaryContact: '+92-21-1234567',
        secondaryContact: '+92-21-1234568',
        email: 'info@pfizer.pk',
        isActive: true
      },
      {
        vendorId,
        brandName: 'GlaxoSmithKline',
        address: '456 Healthcare Avenue, Lahore',
        primaryContact: '+92-42-2345678',
        secondaryContact: '+92-42-2345679',
        email: 'contact@gsk.pk',
        isActive: true
      },
      {
        vendorId,
        brandName: 'Novartis Pakistan',
        address: '789 Pharma Plaza, Islamabad',
        primaryContact: '+92-51-3456789',
        secondaryContact: '+92-51-3456790',
        email: 'info@novartis.pk',
        isActive: true
      },
      {
        vendorId,
        brandName: 'Sanofi Aventis',
        address: '321 Medicine Street, Faisalabad',
        primaryContact: '+92-41-4567890',
        secondaryContact: '+92-41-4567891',
        email: 'pakistan@sanofi.com',
        isActive: true
      },
      {
        vendorId,
        brandName: 'Roche Pakistan',
        address: '654 Health Center, Rawalpindi',
        primaryContact: '+92-51-5678901',
        secondaryContact: '+92-51-5678902',
        email: 'info@roche.pk',
        isActive: true
      }
    ];

    return await Brand.insertMany(brandsData);
  }

  /**
   * Create areas
   */
  static async createAreas(vendorId) {
    const areasData = [
      { vendorId, area: 'Downtown Medical District' },
      { vendorId, area: 'Residential Healthcare Zone' },
      { vendorId, area: 'Industrial Medical Area' },
      { vendorId, area: 'Market Pharmacy District' },
      { vendorId, area: 'Educational Medical Zone' },
      { vendorId, area: 'Commercial Healthcare Area' },
      { vendorId, area: 'Hospital District' },
      { vendorId, area: 'Clinic Zone' },
      { vendorId, area: 'University Medical Area' },
      { vendorId, area: 'Shopping Medical District' }
    ];

    return await Area.insertMany(areasData);
  }

  /**
   * Create sub-areas
   */
  static async createSubAreas(vendorId, areas) {
    const subAreasData = [];
    
    areas.forEach(area => {
      const subAreaNames = [
        `${area.area} - North`,
        `${area.area} - South`,
        `${area.area} - East`,
        `${area.area} - West`,
        `${area.area} - Central`
      ];
      
      subAreaNames.forEach(subAreaName => {
        subAreasData.push({
          vendorId,
          areaId: area._id,
          subAreaName: subAreaName,
          isActive: true
        });
      });
    });

    return await SubArea.insertMany(subAreasData);
  }

  /**
   * Create groups
   */
  static async createGroups(vendorId, brands) {
    const groupsData = [];
    
    brands.forEach(brand => {
      const groupNames = [
        'Antibiotics',
        'Analgesics',
        'Cardiovascular',
        'Antidiabetics',
        'Respiratory',
        'Gastrointestinal',
        'Neurological',
        'Dermatological',
        'Ophthalmological',
        'Gynecological'
      ];
      
      groupNames.forEach(groupName => {
        groupsData.push({
          vendorId,
          brandId: brand._id,
          groupName,
          isActive: true
        });
      });
    });

    return await Group.insertMany(groupsData);
  }

  /**
   * Create sub-groups
   */
  static async createSubGroups(vendorId, groups) {
    const subGroupsData = [];
    
    groups.forEach(group => {
      const subGroupNames = [
        `${group.groupName} - Tablets`,
        `${group.groupName} - Capsules`,
        `${group.groupName} - Injections`,
        `${group.groupName} - Syrups`,
        `${group.groupName} - Creams`
      ];
      
      subGroupNames.forEach(subGroupName => {
        subGroupsData.push({
          vendorId,
          groupId: group._id,
          subGroupName,
          isActive: true
        });
      });
    });

    return await SubGroup.insertMany(subGroupsData);
  }

  /**
   * Create products
   */
  static async createProducts(vendorId, brands, groups, subGroups) {
    const productsData = [];
    
    const sampleProducts = [
      { productName: 'Amoxicillin', packingSize: '500mg x 20 capsules', cartonSize: 200 },
      { productName: 'Paracetamol', packingSize: '500mg x 20 tablets', cartonSize: 300 },
      { productName: 'Aspirin', packingSize: '300mg x 30 tablets', cartonSize: 250 },
      { productName: 'Ibuprofen', packingSize: '400mg x 20 tablets', cartonSize: 200 },
      { productName: 'Metformin', packingSize: '500mg x 30 tablets', cartonSize: 200 },
      { productName: 'Insulin', packingSize: '100IU/ml x 10ml vial', cartonSize: 50 },
      { productName: 'Salbutamol', packingSize: '100mcg x 200 doses', cartonSize: 50 },
      { productName: 'Omeprazole', packingSize: '20mg x 30 capsules', cartonSize: 200 },
      { productName: 'Vitamin D', packingSize: '1000IU x 30 tablets', cartonSize: 300 },
      { productName: 'Calcium', packingSize: '500mg x 60 tablets', cartonSize: 200 }
    ];

    subGroups.forEach(subGroup => {
      const group = groups.find(g => g._id.toString() === subGroup.groupId.toString());
      const brand = brands.find(b => b._id.toString() === group.brandId.toString());
      
      // Create 1-2 products per sub-group
      const productCount = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < productCount && i < sampleProducts.length; i++) {
        const sampleProduct = sampleProducts[i];
        productsData.push({
          vendorId,
          brandId: brand._id,
          groupId: group._id,
          subGroupId: subGroup._id,
          productName: `${sampleProduct.productName} - ${subGroup.subGroupName}`,
          packingSize: sampleProduct.packingSize,
          cartonSize: sampleProduct.cartonSize,
          isActive: true
        });
      }
    });

    return await Product.insertMany(productsData);
  }

  /**
   * Create customers
   */
  static async createCustomers(vendorId) {
    // Get areas to assign to customers
    const areas = await Area.find({ vendorId });
    const subAreas = await SubArea.find({ vendorId });
    
    if (areas.length === 0) {
      throw new Error('No areas found for creating customers');
    }

    const customersData = [
      {
        vendorId,
        customerName: 'City General Hospital',
        customerProvince: 'Punjab',
        customerCity: 'Lahore',
        customerAddress: '123 Hospital Road, Lahore',
        customerCategory: 'Hospital',
        customerArea: areas[0]._id,
        customerSubArea: subAreas[0] ? subAreas[0]._id : null,
        customerPrimaryContact: '+92-42-1111111',
        customerSecondaryContact: '+92-42-1111112',
        customerCnic: '35201-1234567-8',
        customerLicenseNumber: 'LIC-HOSP-001',
        customerLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      },
      {
        vendorId,
        customerName: 'Medicare Pharmacy',
        customerProvince: 'Sindh',
        customerCity: 'Karachi',
        customerAddress: '456 Pharmacy Street, Karachi',
        customerCategory: 'Pharmacy',
        customerArea: areas[1] ? areas[1]._id : areas[0]._id,
        customerSubArea: subAreas[1] ? subAreas[1]._id : null,
        customerPrimaryContact: '+92-21-2222222',
        customerSecondaryContact: '+92-21-2222223',
        customerCnic: '35201-2345678-9',
        customerLicenseNumber: 'LIC-PHARM-002',
        customerLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      },
      {
        vendorId,
        customerName: 'Health Plus Pharmacy',
        customerProvince: 'Khyber Pakhtunkhwa',
        customerCity: 'Peshawar',
        customerAddress: '789 Pharmacy Avenue, Peshawar',
        customerCategory: 'Pharmacy',
        customerArea: areas[2] ? areas[2]._id : areas[0]._id,
        customerSubArea: subAreas[2] ? subAreas[2]._id : null,
        customerPrimaryContact: '+92-91-3333333',
        customerSecondaryContact: '+92-91-3333334',
        customerCnic: '35201-3456789-0',
        customerLicenseNumber: 'LIC-PHARM-003',
        customerLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      },
      {
        vendorId,
        customerName: 'University Medical Center',
        customerProvince: 'Punjab',
        customerCity: 'Faisalabad',
        customerAddress: '321 University Road, Faisalabad',
        customerCategory: 'Hospital',
        customerArea: areas[3] ? areas[3]._id : areas[0]._id,
        customerSubArea: subAreas[3] ? subAreas[3]._id : null,
        customerPrimaryContact: '+92-41-4444444',
        customerSecondaryContact: '+92-41-4444445',
        customerCnic: '35201-4567890-1',
        customerLicenseNumber: 'LIC-HOSP-004',
        customerLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      },
      {
        vendorId,
        customerName: 'Community Health Wholesaler',
        customerProvince: 'Balochistan',
        customerCity: 'Quetta',
        customerAddress: '654 Health Street, Quetta',
        customerCategory: 'Wholesaler',
        customerArea: areas[4] ? areas[4]._id : areas[0]._id,
        customerSubArea: subAreas[4] ? subAreas[4]._id : null,
        customerPrimaryContact: '+92-81-5555555',
        customerSecondaryContact: '+92-81-5555556',
        customerCnic: '35201-5678901-2',
        customerLicenseNumber: 'LIC-WHOLESALE-005',
        customerLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      },
      {
        vendorId,
        customerName: 'MediCare Retail Store',
        customerProvince: 'Sindh',
        customerCity: 'Hyderabad',
        customerAddress: '987 Retail Plaza, Hyderabad',
        customerCategory: 'Retailer',
        customerArea: areas[5] ? areas[5]._id : areas[0]._id,
        customerSubArea: subAreas[5] ? subAreas[5]._id : null,
        customerPrimaryContact: '+92-22-6666666',
        customerSecondaryContact: '+92-22-6666667',
        customerCnic: '35201-6789012-3',
        customerLicenseNumber: 'LIC-RETAIL-006',
        customerLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      }
    ];

    return await UserCustomer.insertMany(customersData);
  }

  /**
   * Create employees
   */
  static async createEmployees(vendorId) {
    const employeesData = [
      {
        vendorId,
        employeeName: 'Ahmed Ali',
        city: 'Lahore',
        address: '123 Employee Street, Lahore',
        primaryContact: '+92-42-6666666',
        secondaryContact: '+92-42-6666667',
        cnic: '35201-1111111-1',
        salary: 150000,
        designation: 'Manager',
        isActive: true
      },
      {
        vendorId,
        employeeName: 'Fatima Khan',
        city: 'Karachi',
        address: '456 Employee Avenue, Karachi',
        primaryContact: '+92-21-7777777',
        secondaryContact: '+92-21-7777778',
        cnic: '35201-2222222-2',
        salary: 180000,
        designation: 'Supervisor',
        isActive: true
      },
      {
        vendorId,
        employeeName: 'Muhammad Hassan',
        city: 'Islamabad',
        address: '789 Employee Road, Islamabad',
        primaryContact: '+92-51-8888888',
        secondaryContact: '+92-51-8888889',
        cnic: '35201-3333333-3',
        salary: 200000,
        designation: 'Admin',
        isActive: true
      },
      {
        vendorId,
        employeeName: 'Ayesha Malik',
        city: 'Faisalabad',
        address: '321 Employee Lane, Faisalabad',
        primaryContact: '+92-41-9999999',
        secondaryContact: '+92-41-9999990',
        cnic: '35201-4444444-4',
        salary: 160000,
        designation: 'Salesman',
        isActive: true
      },
      {
        vendorId,
        employeeName: 'Usman Sheikh',
        city: 'Rawalpindi',
        address: '654 Employee Plaza, Rawalpindi',
        primaryContact: '+92-51-0000000',
        secondaryContact: '+92-51-0000001',
        cnic: '35201-5555555-5',
        salary: 170000,
        designation: 'Technician',
        isActive: true
      }
    ];

    return await Employee.insertMany(employeesData);
  }

  /**
   * Create transactions (expenses, sales invoices, purchase invoices)
   */
  static async createTransactions(vendorId) {
    try {
      console.log(`💰 Creating transactions for vendor: ${vendorId}`);
      
      // Get required data
      const [brands, customers, employees, products] = await Promise.all([
        Brand.find({ vendorId }),
        UserCustomer.find({ vendorId }),
        Employee.find({ vendorId }),
        Product.find({ vendorId })
      ]);

      if (brands.length === 0 || customers.length === 0 || employees.length === 0 || products.length === 0) {
        throw new Error('Required master data not found for creating transactions');
      }

      // 1. Create Expenses (2-3 expenses)
      const expenses = await this.createExpenses(vendorId, brands);
      console.log(`✅ Created ${expenses.length} expenses`);
      
      // 2. Create Purchase Invoices (2-3 purchase invoices)
      const purchaseInvoices = await this.createPurchaseInvoices(vendorId, brands, products);
      console.log(`✅ Created ${purchaseInvoices.length} purchase invoices`);
      
      // 3. Create Sales Invoices (2-3 sales invoices with profit)
      const salesInvoices = await this.createSalesInvoices(vendorId, customers, employees, products);
      console.log(`✅ Created ${salesInvoices.length} sales invoices`);
      
      // 4. Create Ledger Transactions
      await this.createLedgerTransactions(vendorId, expenses, purchaseInvoices, salesInvoices);
      console.log(`✅ Created ledger transactions`);
      
      return {
        success: true,
        message: 'Transactions created successfully',
        data: {
          expenses: expenses.length,
          purchaseInvoices: purchaseInvoices.length,
          salesInvoices: salesInvoices.length
        }
      };
    } catch (error) {
      console.error('Error creating transactions:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive transactions WITHOUT ledger entries (for sync testing)
   */
  static async createComprehensiveTransactions(vendorId) {
    try {
      console.log(`🧪 Creating comprehensive transactions for vendor: ${vendorId}`);
      
      // Get required data
      const [brands, customers, employees, products] = await Promise.all([
        Brand.find({ vendorId }),
        UserCustomer.find({ vendorId }),
        Employee.find({ vendorId }),
        Product.find({ vendorId })
      ]);

      if (brands.length === 0 || customers.length === 0 || employees.length === 0 || products.length === 0) {
        throw new Error('Required master data not found for creating transactions');
      }

      // 1. Create Comprehensive Expenses (5-8 expenses with different categories)
      const expenses = await this.createComprehensiveExpenses(vendorId, brands);
      console.log(`✅ Created ${expenses.length} comprehensive expenses`);
      
      // 2. Create Comprehensive Purchase Invoices (8-12 purchase invoices with multiple products)
      const purchaseInvoices = await this.createComprehensivePurchaseInvoices(vendorId, brands, products);
      console.log(`✅ Created ${purchaseInvoices.length} comprehensive purchase invoices`);
      
      // 3. Create Comprehensive Sales Invoices (10-15 sales invoices with multiple products and payments)
      const salesInvoices = await this.createComprehensiveSalesInvoices(vendorId, customers, employees, products);
      console.log(`✅ Created ${salesInvoices.length} comprehensive sales invoices`);
      
      // Note: NO ledger transactions created - this is for sync testing!
      console.log(`🎯 Comprehensive test data created - ready for sync testing!`);
      
      return {
        success: true,
        message: 'Comprehensive transactions created successfully (no ledger entries - ready for sync)',
        data: {
          expenses: expenses.length,
          purchaseInvoices: purchaseInvoices.length,
          salesInvoices: salesInvoices.length,
          totalTransactions: expenses.length + purchaseInvoices.length + salesInvoices.length
        }
      };
    } catch (error) {
      console.error('Error creating comprehensive transactions:', error);
      throw error;
    }
  }

  /**
   * Create expenses
   */
  static async createExpenses(vendorId, brands) {
    const expensesData = [
      {
        vendorId,
        brandId: brands[0]._id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        description: 'Office Rent - Monthly',
        amount: 50000,
        expenseCategory: 'Rent',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[1]._id,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        description: 'Electricity Bill - Monthly',
        amount: 25000,
        expenseCategory: 'Electricity',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[2]._id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        description: 'Internet and Phone - Monthly',
        amount: 15000,
        expenseCategory: 'Internet',
        isActive: true
      }
    ];

    return await Expense.insertMany(expensesData);
  }

  /**
   * Create purchase invoices
   */
  static async createPurchaseInvoices(vendorId, brands, products) {
    const purchaseInvoicesData = [];
    
    // Create 2-3 purchase invoices
    for (let i = 0; i < 3; i++) {
      const brand = brands[i % brands.length];
      const invoiceDate = new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000);
      
      // Select 3-5 products for this invoice
      const selectedProducts = products.slice(i * 3, (i + 1) * 3 + 2);
      
      let grossTotal = 0;
      const purchaseProducts = [];
      
      selectedProducts.forEach(product => {
        const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 units
        const unitPrice = Math.floor(Math.random() * 500) + 100; // 100-600 per unit
        const total = quantity * unitPrice;
        
        grossTotal += total;
        
        purchaseProducts.push({
          vendorId,
          productId: product._id,
          quantity,
          unitPrice,
          total
        });
      });
      
      const freight = Math.floor(grossTotal * 0.05); // 5% freight
      const flatDiscount = Math.floor(grossTotal * 0.02); // 2% discount
      const specialDiscount = Math.floor(grossTotal * 0.01); // 1% special discount
      const grandTotal = grossTotal + freight - flatDiscount - specialDiscount;
      
      const cashPaid = Math.floor(grandTotal * 0.3); // 30% cash
      const creditAmount = grandTotal - cashPaid;
      
      const purchaseInvoice = {
        vendorId,
        brandId: brand._id,
        date: invoiceDate,
        invoiceNumber: `PI-${Date.now()}-${i + 1}`,
        invoiceDate: invoiceDate,
        grossTotal,
        freight,
        flatDiscount,
        specialDiscount,
        grandTotal,
        cashPaid,
        creditAmount,
        remarks: `Purchase invoice ${i + 1} from ${brand.brandName}`,
        isActive: true
      };
      
      const createdInvoice = await PurchaseEntry.create(purchaseInvoice);
      
      // Create purchase products
      const purchaseProductData = purchaseProducts.map(pp => ({
        ...pp,
        purchaseEntryId: createdInvoice._id
      }));
      
      await PurchaseProduct.insertMany(purchaseProductData);
      
      purchaseInvoicesData.push(createdInvoice);
    }
    
    return purchaseInvoicesData;
  }

  /**
   * Create sales invoices with profit
   */
  static async createSalesInvoices(vendorId, customers, employees, products) {
    const salesInvoicesData = [];
    
    // Create 2-3 sales invoices
    for (let i = 0; i < 3; i++) {
      const customer = customers[i % customers.length];
      const deliverBy = employees[i % employees.length];
      const bookedBy = employees[(i + 1) % employees.length];
      const invoiceDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      
      // Select 3-5 products for this invoice
      const selectedProducts = products.slice(i * 3, (i + 1) * 3 + 2);
      
      let subtotal = 0;
      const salesProducts = [];
      
      selectedProducts.forEach(product => {
        const quantity = Math.floor(Math.random() * 30) + 5; // 5-35 units
        const unitPrice = Math.floor(Math.random() * 800) + 200; // 200-1000 per unit (higher than purchase)
        const total = quantity * unitPrice;
        
        subtotal += total;
        
        salesProducts.push({
          vendorId,
          productId: product._id,
          quantity,
          unitPrice,
          total
        });
      });
      
      const totalDiscount = Math.floor(subtotal * 0.05); // 5% discount
      const grandTotal = subtotal - totalDiscount;
      
      const cash = Math.floor(grandTotal * 0.4); // 40% cash
      const credit = grandTotal - cash;
      
      const salesInvoice = {
        vendorId,
        customerId: customer._id,
        date: invoiceDate,
        licenseNumber: `LIC-${Date.now()}-${i + 1}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        deliverBy: deliverBy._id,
        bookedBy: bookedBy._id,
        deliveryLogNumber: `DL-${Date.now()}-${i + 1}`,
        subtotal,
        totalDiscount,
        grandTotal,
        cash,
        credit,
        remarks: `Sales invoice ${i + 1} to ${customer.customerName}`,
        isActive: true
      };
      
      const createdInvoice = await SalesInvoice.create(salesInvoice);
      
      // Create sales products
      const salesProductData = salesProducts.map(sp => ({
        ...sp,
        salesInvoiceId: createdInvoice._id
      }));
      
      await SalesProduct.insertMany(salesProductData);
      
      salesInvoicesData.push(createdInvoice);
    }
    
    return salesInvoicesData;
  }

  /**
   * Create ledger transactions
   */
  static async createLedgerTransactions(vendorId, expenses, purchaseInvoices, salesInvoices) {
    try {
      // Create ledger transactions for expenses
      for (const expense of expenses) {
        await LedgerService.createTransactionFromExpense(expense);
      }
      
      // Create ledger transactions for purchase invoices
      for (const purchaseInvoice of purchaseInvoices) {
        await LedgerService.createTransactionFromPurchaseEntry(purchaseInvoice);
      }
      
      // Create ledger transactions for sales invoices
      for (const salesInvoice of salesInvoices) {
        await LedgerService.createTransactionFromSalesInvoice(salesInvoice);
      }
      
      console.log(`✅ Created ledger transactions for all invoices and expenses`);
    } catch (error) {
      console.error('Error creating ledger transactions:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive expenses with different categories
   */
  static async createComprehensiveExpenses(vendorId, brands) {
    const expensesData = [
      {
        vendorId,
        brandId: brands[0]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        description: 'Office Rent - Monthly Payment',
        amount: 45000,
        expenseCategory: 'Rent',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[1]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Electricity Bill - Commercial',
        amount: 12500,
        expenseCategory: 'Electricity',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[2]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Internet and Phone Services',
        amount: 8500,
        expenseCategory: 'Internet',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[0]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Office Supplies and Stationery',
        amount: 75000,
        expenseCategory: 'Supplies',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[3]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Communication Services',
        amount: 25000,
        expenseCategory: 'Communication',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[4]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Vehicle Maintenance',
        amount: 15000,
        expenseCategory: 'Maintenance',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[1]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Office Equipment Purchase',
        amount: 5500,
        expenseCategory: 'Equipment',
        isActive: true
      },
      {
        vendorId,
        brandId: brands[2]._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: 'Miscellaneous Business Expenses',
        amount: 20000,
        expenseCategory: 'Miscellaneous',
        isActive: true
      }
    ];

    return await Expense.insertMany(expensesData);
  }

  /**
   * Create comprehensive purchase invoices with multiple products
   */
  static async createComprehensivePurchaseInvoices(vendorId, brands, products) {
    const purchaseInvoices = [];
    
    // Create 10 comprehensive purchase invoices
    for (let i = 0; i < 10; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const invoiceDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Random date within last 60 days
      
      // Select 2-5 random products for this invoice
      const selectedProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 4) + 2);
      
      let grossTotal = 0;
      const purchaseProducts = [];
      
      // Create purchase products for this invoice
      for (const product of selectedProducts) {
        const cartons = Math.floor(Math.random() * 10) + 1; // 1-10 cartons
        const pieces = Math.floor(Math.random() * 20) + 1; // 1-20 pieces
        const netPrice = Math.floor(Math.random() * 500) + 100; // 100-600 price
        const discount = Math.floor(Math.random() * 10); // 0-10% discount
        const batchNumber = `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const expiryDate = new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000); // Random expiry within 1 year
        
        // Calculate pricing
        const salePrice = Math.floor(netPrice * 1.3); // 30% markup
        const minSalePrice = Math.floor(netPrice * 1.1); // 10% markup minimum
        const retailPrice = Math.floor(netPrice * 1.5); // 50% markup
        const invoicePrice = netPrice;
        
        purchaseProducts.push({
          vendorId,
          productId: product._id,
          batchNumber,
          expiryDate,
          cartons,
          pieces,
          quantity: (cartons * product.cartonSize) + pieces, // Will be calculated by pre-save middleware
          bonus: Math.floor(Math.random() * 5), // 0-5 bonus
          netPrice,
          discount,
          discountType: 'percentage',
          effectiveCostPerPiece: netPrice, // Will be calculated by pre-save middleware
          totalAmount: netPrice * ((cartons * product.cartonSize) + pieces), // Will be calculated by pre-save middleware
          salePrice,
          minSalePrice,
          retailPrice,
          invoicePrice,
          isActive: true
        });
        
        grossTotal += netPrice * ((cartons * product.cartonSize) + pieces);
      }
      
      const freight = Math.floor(grossTotal * 0.05); // 5% freight
      const flatDiscount = Math.floor(grossTotal * 0.02); // 2% discount
      const specialDiscount = Math.floor(grossTotal * 0.01); // 1% special discount
      const grandTotal = grossTotal + freight - flatDiscount - specialDiscount;
      
      const cashPaid = Math.floor(grandTotal * (0.3 + Math.random() * 0.7)); // 30-100% cash paid
      const creditAmount = grandTotal - cashPaid;
      
      const purchaseInvoice = {
        vendorId,
        brandId: brand._id,
        invoiceNumber: `PI-${String(i + 1).padStart(4, '0')}-${new Date().getFullYear()}`,
        date: invoiceDate,
        invoiceDate: invoiceDate,
        grossTotal,
        freight,
        flatDiscount,
        specialDiscount,
        grandTotal,
        cashPaid,
        creditAmount,
        remarks: `Purchase invoice ${i + 1} from ${brand.brandName}`,
        isActive: true
      };
      
      const savedInvoice = await PurchaseEntry.create(purchaseInvoice);
      
      // Create purchase products with all required fields
      const purchaseProductData = purchaseProducts.map(pp => ({
        ...pp,
        purchaseEntryId: savedInvoice._id
      }));
      
      await PurchaseProduct.insertMany(purchaseProductData);
      
      purchaseInvoices.push(savedInvoice);
    }
    
    return purchaseInvoices;
  }

  /**
   * Create comprehensive sales invoices with multiple products and payments
   */
  static async createComprehensiveSalesInvoices(vendorId, customers, employees, products) {
    const salesInvoices = [];
    
    // Create 12 comprehensive sales invoices
    for (let i = 0; i < 12; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const deliverBy = employees[Math.floor(Math.random() * employees.length)];
      const bookedBy = employees[Math.floor(Math.random() * employees.length)];
      const invoiceDate = new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000); // Random date within last 45 days
      
      // Select 2-6 random products for this invoice
      const selectedProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 5) + 2);
      
      let subtotal = 0;
      const salesProducts = [];
      
      // Create sales products for this invoice
      for (const product of selectedProducts) {
        const quantity = Math.floor(Math.random() * 30) + 5; // 5-35 quantity
        const price = Math.floor(Math.random() * 800) + 200; // 200-1000 price (higher than purchase)
        const totalPrice = quantity * price;
        const batchNumber = `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const expiryDate = new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000); // Random expiry within 1 year
        
        salesProducts.push({
          vendorId,
          productId: product._id,
          productName: product.productName,
          batchNumber,
          expiry: expiryDate,
          availableStock: quantity + Math.floor(Math.random() * 50), // More than quantity sold
          quantity,
          bonus: Math.floor(Math.random() * 3), // 0-3 bonus
          totalQuantity: quantity + Math.floor(Math.random() * 3), // quantity + bonus
          lessToMinimumCheck: Math.random() > 0.8, // 20% chance
          price,
          percentageDiscount: Math.floor(Math.random() * 10), // 0-10% discount
          flatDiscount: Math.floor(Math.random() * 100), // 0-100 flat discount
          effectiveCostPerPiece: Math.floor(price * 0.7), // Assume 30% margin
          totalAmount: totalPrice,
          originalSalePrice: price,
          minSalePrice: Math.floor(price * 0.9), // 10% below original
          isActive: true
        });
        
        subtotal += totalPrice;
      }
      
      const totalDiscount = Math.floor(subtotal * (0.02 + Math.random() * 0.08)); // 2-10% discount
      const grandTotal = subtotal - totalDiscount;
      
      const cash = Math.floor(grandTotal * (0.2 + Math.random() * 0.8)); // 20-100% cash
      const credit = grandTotal - cash;
      
      // Create payment details for some invoices
      const paymentDetails = [];
      if (credit > 0 && Math.random() > 0.3) { // 70% chance of having payment details
        const numPayments = Math.floor(Math.random() * 3) + 1; // 1-3 payments
        let remainingCredit = credit;
        
        for (let j = 0; j < numPayments && remainingCredit > 0; j++) {
          const paymentAmount = j === numPayments - 1 
            ? remainingCredit 
            : Math.floor(remainingCredit * (0.3 + Math.random() * 0.4)); // 30-70% of remaining
          
          paymentDetails.push({
            amountPaid: paymentAmount,
            date: new Date(invoiceDate.getTime() + (j + 1) * 7 * 24 * 60 * 60 * 1000), // Weekly payments
          });
          
          remainingCredit -= paymentAmount;
        }
      }
      
      const salesInvoice = {
        vendorId,
        customerId: customer._id,
        date: invoiceDate,
        licenseNumber: `LIC-${Date.now()}-${i + 1}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        deliverBy: deliverBy._id,
        bookedBy: bookedBy._id,
        deliveryLogNumber: `SL-${String(i + 1).padStart(4, '0')}-${new Date().getFullYear()}`,
        subtotal,
        totalDiscount,
        grandTotal,
        cash,
        credit,
        paymentDetails,
        remarks: `Sales invoice ${i + 1} to ${customer.customerName}`,
        isActive: true
      };
      
      const savedInvoice = await SalesInvoice.create(salesInvoice);
      
      // Create sales products with all required fields
      const salesProductData = salesProducts.map(sp => ({
        ...sp,
        salesInvoiceId: savedInvoice._id,
        inventoryId: savedInvoice._id // Using invoice ID as inventory reference for simplicity
      }));
      
      await SalesProduct.insertMany(salesProductData);
      
      salesInvoices.push(savedInvoice);
    }
    
    return salesInvoices;
  }
}

module.exports = SeedService;
