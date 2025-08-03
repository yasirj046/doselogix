const Customer = require("../models/customerModel");
const CustomerCounter = require("../models/customerCounterModel");
const { CITIES } = require("../constants/cities");

// Generate unique customer ID
const generateCustomerId = async (city) => {
  try {
    // Find city code
    let cityCode = null;
    for (const province in CITIES) {
      if (CITIES[province][city]) {
        cityCode = CITIES[province][city].code;
        break;
      }
    }

    if (!cityCode) {
      throw new Error("Invalid city");
    }

    // Get next sequence number for this specific city
    const counter = await CustomerCounter.findOneAndUpdate(
      { city },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    // Format: cityCode + citySequence (padded to 2 digits)
    const customerId = `${cityCode}${counter.sequence.toString().padStart(2, '0')}`;
    
    return customerId;
  } catch (error) {
    throw error;
  }
};

exports.createCustomer = async (customerData) => {
  try {
    const customerId = await generateCustomerId(customerData.city);
    const customer = new Customer({
      ...customerData,
      customerId
    });
    return await customer.save();
  } catch (error) {
    throw error;
  }
};

exports.getAllCustomers = async (page, limit, keyword) => {
  let query = { isActive: true };
  if (keyword && keyword !== "") {
    query.$text = { $search: keyword };
  }
  return await Customer.paginate(query, { 
    page, 
    limit, 
    sort: { createdAt: -1 },
    populate: [
      { path: 'area', select: 'name city' },
      { path: 'subArea', select: 'name' }
    ]
  });
};

exports.getCustomerById = async (id) => {
  return await Customer.findOne({ _id: id, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name');
};

exports.getCustomerByCustomerId = async (customerId) => {
  return await Customer.findOne({ customerId, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name');
};

exports.updateCustomer = async (id, customerData) => {
  // Remove customerId from update data to prevent modification
  const { customerId, ...updateData } = customerData;
  return await Customer.findOneAndUpdate(
    { _id: id, isActive: true }, 
    updateData, 
    { new: true, runValidators: true }
  ).populate('area', 'name city')
   .populate('subArea', 'name');
};

exports.deleteCustomer = async (id) => {
  // Soft delete - mark as inactive
  return await Customer.findByIdAndUpdate(
    id, 
    { isActive: false }, 
    { new: true }
  );
};

exports.getCustomersByProvince = async (province) => {
  return await Customer.find({ province, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};

exports.getCustomersByCity = async (city) => {
  return await Customer.find({ city, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};

exports.getCustomersByCategory = async (category) => {
  return await Customer.find({ category, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};

exports.getCustomersByArea = async (areaId) => {
  return await Customer.find({ area: areaId, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};

exports.getCustomersBySubArea = async (subAreaId) => {
  return await Customer.find({ subArea: subAreaId, isActive: true })
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};

exports.restoreCustomer = async (id) => {
  // Restore soft-deleted customer
  return await Customer.findByIdAndUpdate(
    id, 
    { isActive: true }, 
    { new: true }
  );
};

exports.getDeletedCustomers = async () => {
  // Get all soft-deleted customers
  return await Customer.find({ isActive: false })
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};

exports.getCustomersWithExpiringLicenses = async (days = 30) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return await Customer.find({ 
    licenseExpiry: { $lte: expiryDate },
    isActive: true 
  })
  .populate('area', 'name city')
  .populate('subArea', 'name')
  .sort({ licenseExpiry: 1 });
};

exports.searchCustomers = async (filters) => {
  let query = { isActive: true };
  
  if (filters.province) query.province = filters.province;
  if (filters.city) query.city = filters.city;
  if (filters.category) query.category = filters.category;
  if (filters.area) query.area = filters.area;
  if (filters.subArea) query.subArea = filters.subArea;
  if (filters.cnic) query['contact.cnic'] = filters.cnic;
  if (filters.licenseNumber) query.licenseNumber = filters.licenseNumber;
  
  return await Customer.find(query)
    .populate('area', 'name city')
    .populate('subArea', 'name')
    .sort({ createdAt: -1 });
};
