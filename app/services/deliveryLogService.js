const DeliveryLog = require('../models/deliveryLogModel');
const SalesInvoice = require('../models/salesInvoiceModel');
const Employee = require('../models/employeeModel');
const mongoose = require('mongoose');

exports.getAllDeliveryLogs = async (page, limit, keyword, vendorId, salesmanId, startDate, endDate, status) => {
  try {
    let query = { vendorId };
    
    // Filter by salesman if provided
    if (salesmanId && salesmanId !== "") {
      query.salesmanId = salesmanId;
    }
    
    // Filter by status if provided
    if (status && status !== "") {
      if (status === 'Active') {
        query.isActive = true;
      } else if (status === 'Inactive') {
        query.isActive = false;
      }
    }
    
    // Filter by date range if provided. Normalize to include whole days.
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.date = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $lte: end };
    }
    
    // Search by keyword in delivery log number
    if (keyword && keyword !== "") {
      query.deliveryLogNumber = { $regex: keyword, $options: 'i' };
    }

    return await DeliveryLog.paginate(query, { 
      page, 
      limit,
      sort: { date: -1 },
      populate: [
        {
          path: 'vendorId',
          select: 'vendorName vendorEmail'
        },
        {
          path: 'salesmanId',
          select: 'employeeName designation'
        },
        {
          path: 'invoices',
          select: 'salesInvoiceNumber grandTotal customerId cash paymentDetails',
          populate: {
            path: 'customerId',
            select: 'customerName'
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error in getAllDeliveryLogs:', error);
    throw error;
  }
};

exports.getDeliveryLogById = async (id, vendorId) => {
  try {
    const deliveryLog = await DeliveryLog.findOne({ _id: id, vendorId })
      .populate('vendorId', 'vendorName vendorEmail')
      .populate('salesmanId', 'employeeName employeeNumber employeeDesignation')
      .populate({
        path: 'invoices',
        select: 'salesInvoiceNumber deliveryLogNumber grandTotal cash credit paymentDetails customerId date',
        populate: [
          {
            path: 'customerId',
            select: 'customerName customerAddress customerCity'
          },
          {
            path: 'salesProducts',
            select: 'productName batchNumber quantity bonus price percentageDiscount flatDiscount totalAmount',
            populate: {
              path: 'productId',
              select: 'productName'
            }
          }
        ]
      });
      
    if (!deliveryLog) {
      return null;
    }

    // Calculate payment status for each invoice
    const deliveryLogWithPaymentStatus = deliveryLog.toObject();
    deliveryLogWithPaymentStatus.invoices = deliveryLogWithPaymentStatus.invoices.map(invoice => {
      const paymentDetails = Array.isArray(invoice.paymentDetails) ? invoice.paymentDetails : [];
      const totalPaid = (invoice.cash || 0) + paymentDetails.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      const grandTotal = invoice.grandTotal || 0;
      
      let paymentStatus = 'Unpaid';
      if (totalPaid >= grandTotal) {
        paymentStatus = 'Paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'Partial';
      }
      
      return {
        ...invoice,
        totalPaid,
        paymentStatus
      };
    });

    return deliveryLogWithPaymentStatus;
  } catch (error) {
    console.error('Error in getDeliveryLogById:', error);
    throw error;
  }
};

exports.createDeliveryLog = async (deliveryLogData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate salesman exists
    const salesman = await Employee.findOne({
      _id: deliveryLogData.salesmanId,
      vendorId: deliveryLogData.vendorId,
      isActive: true
    }).session(session);

    if (!salesman) {
      throw new Error('Salesman not found or inactive');
    }

    // Check if delivery log already exists for this salesman and date
    const startOfDay = new Date(deliveryLogData.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(deliveryLogData.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLog = await DeliveryLog.findOne({
      vendorId: deliveryLogData.vendorId,
      salesmanId: deliveryLogData.salesmanId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).session(session);

    if (existingLog) {
      throw new Error('Delivery log already exists for this salesman on this date');
    }

    // Create delivery log
    const deliveryLog = await DeliveryLog.create([{
      ...deliveryLogData,
      date: startOfDay,
      invoices: [],
      totalAmount: 0
    }], { session });

    await session.commitTransaction();
    return deliveryLog[0];
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in createDeliveryLog:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.updateDeliveryLog = async (vendorId, deliveryLogId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deliveryLog = await DeliveryLog.findOne({
      _id: deliveryLogId,
      vendorId: vendorId
    }).session(session);

    if (!deliveryLog) {
      throw new Error('Delivery log not found');
    }

    const oldDeliveryLogNumber = deliveryLog.deliveryLogNumber;

    // Update delivery log fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'invoices' && key !== 'totalAmount') { // Don't allow direct update of these
        deliveryLog[key] = updateData[key];
      }
    });

    await deliveryLog.save({ session });

    // If delivery log number changed, update all linked invoices
    if (updateData.deliveryLogNumber && updateData.deliveryLogNumber !== oldDeliveryLogNumber) {
      await SalesInvoice.updateMany(
        { _id: { $in: deliveryLog.invoices } },
        { $set: { deliveryLogNumber: updateData.deliveryLogNumber } },
        { session }
      );
    }

    // Recalculate total
    await DeliveryLog.recalculateTotal(deliveryLogId);

    await session.commitTransaction();
    return deliveryLog;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in updateDeliveryLog:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.deleteDeliveryLog = async (vendorId, deliveryLogId) => {
  try {
    const deliveryLog = await DeliveryLog.findOne({
      _id: deliveryLogId,
      vendorId: vendorId
    });

    if (!deliveryLog) {
      throw new Error('Delivery log not found or you do not have permission to delete it');
    }

    // Check if there are linked invoices
    if (deliveryLog.invoices && deliveryLog.invoices.length > 0) {
      throw new Error('Cannot delete delivery log with linked invoices. Remove or reassign invoices first.');
    }

    // Delete the delivery log
    await DeliveryLog.findByIdAndDelete(deliveryLogId);
    return { message: 'Delivery log deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDeliveryLog:', error);
    throw error;
  }
};

exports.recalculateTotal = async (vendorId, deliveryLogId) => {
  try {
    const deliveryLog = await DeliveryLog.findOne({
      _id: deliveryLogId,
      vendorId: vendorId
    });

    if (!deliveryLog) {
      throw new Error('Delivery log not found');
    }

    await DeliveryLog.recalculateTotal(deliveryLogId);
    
    // Fetch updated delivery log
    return await this.getDeliveryLogById(deliveryLogId, vendorId);
  } catch (error) {
    console.error('Error in recalculateTotal:', error);
    throw error;
  }
};

exports.getDeliveryLogsByDateRange = async (vendorId, startDate, endDate, salesmanId) => {
  try {
    let query = { vendorId };
    
    if (salesmanId) {
      query.salesmanId = salesmanId;
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }
    
    return await DeliveryLog.find(query)
      .populate('salesmanId', 'employeeName employeeNumber')
      .populate({
        path: 'invoices',
        select: 'salesInvoiceNumber grandTotal'
      })
      .sort({ date: -1 });
  } catch (error) {
    console.error('Error in getDeliveryLogsByDateRange:', error);
    throw error;
  }
};

exports.getDeliveryLogStats = async (vendorId, startDate, endDate) => {
  try {
    const matchQuery = { vendorId, isActive: true };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchQuery.date = { $gte: start, $lte: end };
    }
    
    const stats = await DeliveryLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalInvoices: { $sum: { $size: '$invoices' } },
          avgAmountPerLog: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    return stats.length > 0 ? stats[0] : {
      totalLogs: 0,
      totalAmount: 0,
      totalInvoices: 0,
      avgAmountPerLog: 0
    };
  } catch (error) {
    console.error('Error in getDeliveryLogStats:', error);
    throw error;
  }
};

exports.getOrGenerateDeliveryLogNumber = async (vendorId, salesmanId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Try to find existing delivery log for this salesman and date
    const existingLog = await DeliveryLog.findOne({
      vendorId,
      salesmanId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (existingLog) {
      // Return existing delivery log number
      return existingLog.deliveryLogNumber;
    }
    
    // Generate what the delivery log number would be if created
    const Employee = require('../models/employeeModel');
    const salesman = await Employee.findById(salesmanId);
    
    if (!salesman) {
      throw new Error('Salesman not found');
    }
    
    // Use last 4 characters of employee ID as employee code
    const employeeIdStr = salesmanId.toString();
    const employeeCode = employeeIdStr.slice(-4);
    
    // Generate delivery log number using the static method
    const deliveryLogNumber = await DeliveryLog.generateDeliveryLogNumber(date, employeeCode);
    
    return deliveryLogNumber;
  } catch (error) {
    console.error('Error in getOrGenerateDeliveryLogNumber:', error);
    throw error;
  }
};

exports.toggleDeliveryLogStatus = async (deliveryLogId, vendorId) => {
  try {
    // First find the current delivery log to get current isActive state
    const currentDeliveryLog = await DeliveryLog.findOne({ 
      _id: deliveryLogId, 
      vendorId: vendorId 
    });
    
    if (!currentDeliveryLog) {
      return null;
    }

    // Toggle the isActive status
    const deliveryLog = await DeliveryLog.findOneAndUpdate(
      { _id: deliveryLogId, vendorId: vendorId },
      { isActive: !currentDeliveryLog.isActive },
      { 
        new: true,
        populate: [
          {
            path: 'vendorId',
            select: 'vendorName vendorEmail'
          },
          {
            path: 'salesmanId',
            select: 'employeeName employeeNumber employeeDesignation'
          }
        ]
      }
    );
    
    return deliveryLog;
  } catch (error) {
    console.error('Error in toggleDeliveryLogStatus:', error);
    throw error;
  }
};

// Sync sales invoices that have deliveryLogNumber but are not present in any delivery log
exports.syncMissingInvoices = async (vendorId, io) => {
  try {
    const SalesInvoice = require('../models/salesInvoiceModel');
    const DeliveryLog = require('../models/deliveryLogModel');

    // Find all invoices that have a deliveryLogNumber (either set or null) and are active
    const invoices = await SalesInvoice.find({
      vendorId,
      deliveryLogNumber: { $exists: true, $ne: null }
    }).select('_id deliverBy date deliveryLogNumber');

    let linkedCount = 0;
    const errors = [];

    const total = invoices.length;
    let processed = 0;

    // Helper to emit progress if io is provided
    const emitProgress = (payload) => {
      try {
        if (io && vendorId) {
          io.to(`vendor_${vendorId}`).emit('sync_progress', payload);
        }
      } catch (err) {
        console.error('Error emitting sync_progress:', err);
      }
    };

    for (const invoice of invoices) {
      processed++;
      try {
        // If invoice is already present in a delivery log, skip
        const existing = await DeliveryLog.findOne({ vendorId, invoices: invoice._id });
        if (existing) {
          // emit a small progress update
          emitProgress({ progress: Math.round((processed / total) * 100), step: 'CHECKING', message: 'Invoice already linked, skipping', stats: { total, linked: linkedCount, skipped: processed - linkedCount, errors } });
          continue;
        }

        // If deliverBy missing, skip and record
        if (!invoice.deliverBy) {
          errors.push({ invoiceId: invoice._id, message: 'Missing deliverBy (salesman) on invoice' });
          emitProgress({ progress: Math.round((processed / total) * 100), step: 'CHECKING', message: 'Missing deliverBy, skipped', stats: { total, linked: linkedCount, skipped: processed - linkedCount, errors } });
          continue;
        }

        // Find or create delivery log for the salesman and date
        const deliveryLog = await DeliveryLog.findOrCreateForSalesman(vendorId, invoice.deliverBy, invoice.date || new Date());

        // Add invoice to delivery log
        await deliveryLog.addInvoice(invoice._id);

        // Ensure invoice deliveryLogNumber matches the delivery log
        if (invoice.deliveryLogNumber !== deliveryLog.deliveryLogNumber) {
          await SalesInvoice.findByIdAndUpdate(invoice._id, { deliveryLogNumber: deliveryLog.deliveryLogNumber });
        }

        linkedCount++;

        // Emit progress update every invoice (can be throttled if needed)
        emitProgress({ progress: Math.round((processed / total) * 100), step: 'LINKING', message: 'Linked invoice to delivery log', stats: { total, linked: linkedCount, skipped: processed - linkedCount, errors } });
      } catch (err) {
        console.error('Error syncing invoice to delivery log:', invoice._id, err);
        errors.push({ invoiceId: invoice._id, message: err.message || String(err) });
        emitProgress({ progress: Math.round((processed / total) * 100), step: 'ERROR', message: err.message || 'Error syncing invoice', stats: { total, linked: linkedCount, skipped: processed - linkedCount, errors } });
      }
    }

    // Emit completion event if io available (use consistent stats keys)
    const skipped = total - linkedCount - errors.length
    try {
      if (io && vendorId) {
        io.to(`vendor_${vendorId}`).emit('sync_complete', { stats: { total, linked: linkedCount, skipped, errors } });
      }
    } catch (err) {
      console.error('Error emitting sync_complete:', err);
    }

    return { total, linked: linkedCount, skipped, errors };
  } catch (error) {
    console.error('Error in syncMissingInvoices:', error);
    throw error;
  }
};
