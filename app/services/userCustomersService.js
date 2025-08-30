const UserCustomers = require("../models/userCustomersModel");

exports.getAllCustomers = async (page, limit, keyword, vendorId, customerProvince, customerCity, status) => {
  try {
    let query = {};
    
    // Filter by vendor if provided
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Filter by province if provided
    if (customerProvince && customerProvince !== "") {
      query.customerProvince = customerProvince;
    }
    
    // Filter by city if provided
    if (customerCity && customerCity !== "") {
      query.customerCity = customerCity;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      query.isActive = status === "active";
    }
    
    // Search functionality - only search in name and primary contact
    if (keyword && keyword !== "") {
      query.$or = [
        { customerName: { $regex: keyword, $options: 'i' } },
        { customerPrimaryContact: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    return await UserCustomers.paginate(query, { 
      page, 
      limit,
      populate: {
        path: 'vendorId',
        select: 'vendorName vendorEmail vendorPhone businessName'
      },
      sort: { createdAt: -1 }
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    throw error;
  }
};

exports.getCustomerById = async (id) => {
  try {
    return await UserCustomers.findById(id).populate('vendorId', 'vendorName vendorEmail vendorPhone businessName');
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw error;
  }
};

exports.createCustomer = async (customerData) => {
  try {
    const customer = new UserCustomers(customerData);
    await customer.save();
    return await customer.populate('vendorId', 'vendorName vendorEmail vendorPhone businessName');
  } catch (error) {
    console.error('Error in createCustomer:', error);
    throw error;
  }
};

exports.updateCustomer = async (id, customerData, vendorId) => {
  try {
    return await UserCustomers.findOneAndUpdate({ _id: id, vendorId: vendorId }, customerData, {
      new: true,
      populate: {
        path: 'vendorId',
        select: 'vendorName vendorEmail vendorPhone businessName'
      }
    });
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    throw error;
  }
};

exports.deleteCustomer = async (id) => {
  try {
    return await UserCustomers.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    throw error;
  }
};

exports.getCustomersByVendor = async (vendorId, filters = {}) => {
  try {
    return await UserCustomers.findCustomersByVendor(vendorId, filters);
  } catch (error) {
    console.error('Error in getCustomersByVendor:', error);
    throw error;
  }
};

exports.getCustomersWithExpiringLicense = async (vendorId, daysBefore = 30) => {
  try {
    return await UserCustomers.findCustomersWithExpiringLicense(vendorId, daysBefore);
  } catch (error) {
    console.error('Error in getCustomersWithExpiringLicense:', error);
    throw error;
  }
};

exports.getCustomersByCategory = async (vendorId, customerCategory) => {
  try {
    return await UserCustomers.find({
      vendorId,
      customerCategory,
      isActive: true
    }).populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    console.error('Error in getCustomersByCategory:', error);
    throw error;
  }
};

exports.getCustomersByLocation = async (vendorId, customerProvince, customerCity = null) => {
  try {
    const query = {
      vendorId,
      customerProvince,
      isActive: true
    };
    
    if (customerCity) {
      query.customerCity = customerCity;
    }
    
    return await UserCustomers.find(query).populate('vendorId', 'vendorName vendorEmail');
  } catch (error) {
    console.error('Error in getCustomersByLocation:', error);
    throw error;
  }
};

exports.toggleCustomerStatus = async (id, vendorId) => {
  try {
    // First find the current customer to get current isActive state
    const currentCustomer = await UserCustomers.findOne({ _id: id, vendorId: vendorId });
    if (!currentCustomer) {
      return null;
    }

    // Toggle the isActive status
    const customer = await UserCustomers.findOneAndUpdate(
      { _id: id, vendorId: vendorId },
      { isActive: !currentCustomer.isActive },
      { 
        new: true,
        populate: {
          path: 'vendorId',
          select: 'vendorName vendorEmail vendorPhone businessName'
        }
      }
    );
    
    return customer;
  } catch (error) {
    console.error('Error in toggleCustomerStatus:', error);
    throw error;
  }
}; 