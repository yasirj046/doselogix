const DeliveryAssignment = require("../models/deliveryAssignmentModel");
const DeliveryAssignmentCounter = require("../models/deliveryAssignmentCounterModel");
const Employee = require("../models/employeeModel");
const mongoose = require("mongoose");

// Generate unique delivery log number
const generateDeliveryLogNumber = async () => {
  const counter = await DeliveryAssignmentCounter.findByIdAndUpdate(
    { _id: "deliveryLogNumber" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `DL-${dateStr}-${counter.sequence_value.toString().padStart(3, "0")}`;
};

const deliveryAssignmentService = {
  // Auto-assign invoice to delivery log (called from invoice service)
  async autoAssignInvoice(invoiceData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { 
        _id: invoiceId,
        invoiceId: invoiceNumber,
        customerId,
        customerName,
        deliverBy,
        bookedBy,
        grandTotal,
        cashReceived,
        creditAmount,
        paymentStatus,
        products,
        date
      } = invoiceData;

      // Get employee details
      const [deliveryPerson, bookingPerson] = await Promise.all([
        Employee.findById(deliverBy).session(session),
        Employee.findById(bookedBy).session(session)
      ]);

      if (!deliveryPerson || !bookingPerson) {
        throw new Error("Employee details not found");
      }

      // Calculate product summary
      const productCount = products ? products.length : 0;
      const totalQuantity = products ? products.reduce((sum, product) => sum + product.totalQuantity, 0) : 0;

      // Create invoice entry for delivery log
      const invoiceEntry = {
        invoiceId,
        invoiceNumber,
        customerId,
        customerName,
        customerArea: deliveryPerson.area || 'N/A',
        license: invoiceData.license || '',
        grandTotal: grandTotal || 0,
        cashReceived: cashReceived || 0,
        creditAmount: creditAmount || 0,
        paymentStatus,
        assignedDate: date || new Date(),
        productCount,
        totalQuantity
      };

      // Format date for unique constraint (YYYY-MM-DD)
      const assignmentDate = new Date(date || new Date());
      assignmentDate.setHours(0, 0, 0, 0);

      // Check if delivery assignment already exists for this deliveryman on this date
      let deliveryAssignment = await DeliveryAssignment.findOne({
        deliverBy,
        date: {
          $gte: assignmentDate,
          $lt: new Date(assignmentDate.getTime() + 24 * 60 * 60 * 1000)
        },
        isActive: true
      }).session(session);

      if (deliveryAssignment) {
        // Update existing delivery assignment - add invoice to array
        deliveryAssignment.invoices.push(invoiceEntry);
        deliveryAssignment.lastUpdatedBy = userId;
        await deliveryAssignment.save({ session });
        
        console.log(`✅ Invoice ${invoiceNumber} added to existing delivery log ${deliveryAssignment.deliveryLogNumber}`);
      } else {
        // Create new delivery assignment
        const deliveryLogNumber = await generateDeliveryLogNumber();
        
        deliveryAssignment = new DeliveryAssignment({
          deliveryLogNumber,
          date: assignmentDate,
          deliverBy,
          deliverymanName: deliveryPerson.name,
          deliverymanCode: deliveryPerson.employeeCode || deliveryPerson.name.substring(0, 6).toUpperCase(),
          deliveryArea: deliveryPerson.area || 'N/A',
          bookedBy,
          bookedByName: bookingPerson.name,
          invoices: [invoiceEntry],
          isActive: true,
          createdBy: userId,
          lastUpdatedBy: userId
        });

        await deliveryAssignment.save({ session });
        
        console.log(`✅ New delivery log ${deliveryLogNumber} created for deliveryman ${deliveryPerson.name}`);
      }

      await session.commitTransaction();
      return deliveryAssignment;

    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error in auto-assign invoice:', error.message);
      throw new Error(`Failed to auto-assign invoice to delivery log: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  // Remove invoice from delivery log (when invoice is deleted)
  async removeInvoiceFromDeliveryLog(invoiceId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find delivery assignment containing this invoice
      const deliveryAssignment = await DeliveryAssignment.findOne({
        'invoices.invoiceId': invoiceId,
        isActive: true
      }).session(session);

      if (!deliveryAssignment) {
        console.log(`ℹ️ No delivery assignment found for invoice ${invoiceId}`);
        return null;
      }

      // Remove invoice from array
      deliveryAssignment.invoices = deliveryAssignment.invoices.filter(
        invoice => !invoice.invoiceId.equals(invoiceId)
      );

      // If no more invoices, delete the delivery assignment
      if (deliveryAssignment.invoices.length === 0) {
        deliveryAssignment.isActive = false;
        console.log(`🗑️ Delivery log ${deliveryAssignment.deliveryLogNumber} marked inactive (no invoices)`);
      }

      deliveryAssignment.lastUpdatedBy = userId;
      await deliveryAssignment.save({ session });

      await session.commitTransaction();
      return deliveryAssignment;

    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error removing invoice from delivery log:', error.message);
      throw new Error(`Failed to remove invoice from delivery log: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  // Update invoice in delivery log (when invoice is updated)
  async updateInvoiceInDeliveryLog(invoiceData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { _id: invoiceId } = invoiceData;

      // Find delivery assignment containing this invoice
      const deliveryAssignment = await DeliveryAssignment.findOne({
        'invoices.invoiceId': invoiceId,
        isActive: true
      }).session(session);

      if (!deliveryAssignment) {
        console.log(`ℹ️ No delivery assignment found for invoice ${invoiceId}`);
        return null;
      }

      // Find and update the invoice in the array
      const invoiceIndex = deliveryAssignment.invoices.findIndex(
        invoice => invoice.invoiceId.equals(invoiceId)
      );

      if (invoiceIndex > -1) {
        // Update invoice details
        const productCount = invoiceData.products ? invoiceData.products.length : 0;
        const totalQuantity = invoiceData.products ? 
          invoiceData.products.reduce((sum, product) => sum + product.totalQuantity, 0) : 0;

        deliveryAssignment.invoices[invoiceIndex].customerName = invoiceData.customerName;
        deliveryAssignment.invoices[invoiceIndex].grandTotal = invoiceData.grandTotal || 0;
        deliveryAssignment.invoices[invoiceIndex].cashReceived = invoiceData.cashReceived || 0;
        deliveryAssignment.invoices[invoiceIndex].creditAmount = invoiceData.creditAmount || 0;
        deliveryAssignment.invoices[invoiceIndex].paymentStatus = invoiceData.paymentStatus;
        deliveryAssignment.invoices[invoiceIndex].productCount = productCount;
        deliveryAssignment.invoices[invoiceIndex].totalQuantity = totalQuantity;
        deliveryAssignment.invoices[invoiceIndex].license = invoiceData.license || '';

        deliveryAssignment.lastUpdatedBy = userId;
        await deliveryAssignment.save({ session });

        console.log(`✅ Invoice ${invoiceData.invoiceId} updated in delivery log ${deliveryAssignment.deliveryLogNumber}`);
      }

      await session.commitTransaction();
      return deliveryAssignment;

    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error updating invoice in delivery log:', error.message);
      throw new Error(`Failed to update invoice in delivery log: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  // Get all delivery assignments with pagination
  async getAllDeliveryAssignments(page, limit, keyword, startDate, endDate, deliverBy, area) {
    try {
      // Build query
      const query = { isActive: true };
      
      if (keyword) {
        query.$or = [
          { deliveryLogNumber: { $regex: keyword, $options: "i" } },
          { deliverymanName: { $regex: keyword, $options: "i" } },
          { deliveryArea: { $regex: keyword, $options: "i" } },
          { 'invoices.invoiceNumber': { $regex: keyword, $options: "i" } },
          { 'invoices.customerName': { $regex: keyword, $options: "i" } }
        ];
      }
      
      if (deliverBy) {
        query.deliverBy = deliverBy;
      }
      
      if (area) {
        query.deliveryArea = { $regex: area, $options: "i" };
      }
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      // Pagination options
      const paginationOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { date: -1, createdAt: -1 },
        populate: [
          { path: "deliverBy", select: "name employeeCode area" },
          { path: "bookedBy", select: "name employeeCode" }
        ]
      };
      
      const result = await DeliveryAssignment.paginate(query, paginationOptions);
      return result;
      
    } catch (error) {
      throw new Error(`Failed to get delivery assignments: ${error.message}`);
    }
  },

  // Get delivery assignment by ID
  async getDeliveryAssignmentById(id) {
    try {
      const deliveryAssignment = await DeliveryAssignment.findById(id)
        .populate("deliverBy", "name employeeCode area phone")
        .populate("bookedBy", "name employeeCode")
        .populate("invoices.invoiceId", "invoiceId date grandTotal paymentStatus")
        .populate("invoices.customerId", "customerName phone address");
      
      if (!deliveryAssignment || !deliveryAssignment.isActive) {
        throw new Error("Delivery assignment not found");
      }
      
      return deliveryAssignment;
      
    } catch (error) {
      throw new Error(`Failed to get delivery assignment: ${error.message}`);
    }
  },

  // Get delivery assignments by deliveryman
  async getDeliveryAssignmentsByDeliveryman(deliverymanId, startDate, endDate) {
    try {
      const query = { 
        deliverBy: deliverymanId,
        isActive: true 
      };
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      const assignments = await DeliveryAssignment.find(query)
        .sort({ date: -1 })
        .populate("deliverBy", "name employeeCode area")
        .populate("bookedBy", "name employeeCode");
      
      return assignments;
      
    } catch (error) {
      throw new Error(`Failed to get delivery assignments by deliveryman: ${error.message}`);
    }
  },

  // Get delivery statistics
  async getDeliveryStats(startDate, endDate) {
    try {
      const matchQuery = { isActive: true };
      
      if (startDate || endDate) {
        matchQuery.date = {};
        if (startDate) matchQuery.date.$gte = new Date(startDate);
        if (endDate) matchQuery.date.$lte = new Date(endDate);
      }
      
      const stats = await DeliveryAssignment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalDeliveryLogs: { $sum: 1 },
            totalInvoices: { $sum: "$totalInvoices" },
            totalAmount: { $sum: "$totalAmount" },
            totalCashReceived: { $sum: "$totalCashReceived" },
            totalCreditAmount: { $sum: "$totalCreditAmount" },
            uniqueDeliverymen: { $addToSet: "$deliverBy" },
            avgInvoicesPerLog: { $avg: "$totalInvoices" },
            avgAmountPerLog: { $avg: "$totalAmount" }
          }
        },
        {
          $project: {
            _id: 0,
            totalDeliveryLogs: 1,
            totalInvoices: 1,
            totalAmount: 1,
            totalCashReceived: 1,
            totalCreditAmount: 1,
            totalDeliverymen: { $size: "$uniqueDeliverymen" },
            avgInvoicesPerLog: { $round: ["$avgInvoicesPerLog", 2] },
            avgAmountPerLog: { $round: ["$avgAmountPerLog", 2] }
          }
        }
      ]);
      
      return stats[0] || {
        totalDeliveryLogs: 0,
        totalInvoices: 0,
        totalAmount: 0,
        totalCashReceived: 0,
        totalCreditAmount: 0,
        totalDeliverymen: 0,
        avgInvoicesPerLog: 0,
        avgAmountPerLog: 0
      };
      
    } catch (error) {
      throw new Error(`Failed to get delivery stats: ${error.message}`);
    }
  }
};

module.exports = deliveryAssignmentService;
