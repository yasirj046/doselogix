const mongoose = require("mongoose");
const inventoryService = require("./inventoryService");

// Combined service for inventory with payment integration
// This implements the PIS (Payment Integration Suggestion) approach

exports.createInventoryWithPayment = async (combinedData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { inventoryData, paymentData } = combinedData;
    
    // Step 1: Create inventory entry
    const inventory = await inventoryService.createInventory(inventoryData);
    
    // Step 2: Prepare ledger entry data (for future ledger module)
    const ledgerData = {
      referenceType: 'inventory',
      referenceId: inventory.inventoryId,
      invoiceNumber: inventoryData.brandInvoice,
      partyType: 'supplier',
      partyId: inventoryData.brandId,
      partyName: inventoryData.brandName,
      totalAmount: inventory.grandTotal,
      cashPaid: paymentData.cashAmount || 0,
      creditAmount: paymentData.creditAmount || 0,
      paymentNotes: paymentData.paymentNotes || '',
      paymentDate: paymentData.paymentDate || new Date(),
      paymentStatus: calculatePaymentStatus(
        inventory.grandTotal, 
        paymentData.cashAmount || 0, 
        paymentData.creditAmount || 0
      ),
      remainingBalance: calculateRemainingBalance(
        inventory.grandTotal,
        paymentData.cashAmount || 0,
        paymentData.creditAmount || 0
      ),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Step 3: For now, we'll store payment data in a temporary collection
    // Later when ledger module is implemented, this will call ledgerService.createLedgerEntry()
    const TemporaryPayment = mongoose.model('TemporaryPayment', new mongoose.Schema({}, { strict: false }));
    const payment = new TemporaryPayment(ledgerData);
    await payment.save({ session });
    
    await session.commitTransaction();
    
    return {
      inventory,
      payment: ledgerData,
      message: "Inventory and payment data saved successfully"
    };
    
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Failed to create inventory with payment: ${error.message}`);
  } finally {
    session.endSession();
  }
};

// Helper function to calculate payment status
const calculatePaymentStatus = (grandTotal, cashAmount, creditAmount) => {
  const totalPaid = cashAmount + creditAmount;
  
  if (totalPaid >= grandTotal) {
    return 'fully_paid';
  } else if (totalPaid > 0) {
    return 'partially_paid';
  } else {
    return 'unpaid';
  }
};

// Helper function to calculate remaining balance
const calculateRemainingBalance = (grandTotal, cashAmount, creditAmount) => {
  const totalPaid = cashAmount + creditAmount;
  return Math.max(0, grandTotal - totalPaid);
};

// Get inventory with payment details
exports.getInventoryWithPayment = async (inventoryId) => {
  try {
    const inventory = await inventoryService.getInventoryById(inventoryId);
    
    // Get payment data from temporary collection
    const TemporaryPayment = mongoose.model('TemporaryPayment', new mongoose.Schema({}, { strict: false }));
    const payment = await TemporaryPayment.findOne({ referenceId: inventory.inventoryId });
    
    return {
      inventory,
      payment: payment || null
    };
    
  } catch (error) {
    throw new Error(`Failed to get inventory with payment: ${error.message}`);
  }
};

// Update payment information
exports.updateInventoryPayment = async (inventoryId, paymentData) => {
  try {
    const inventory = await inventoryService.getInventoryById(inventoryId);
    
    const updatedPaymentData = {
      cashPaid: paymentData.cashAmount || 0,
      creditAmount: paymentData.creditAmount || 0,
      paymentNotes: paymentData.paymentNotes || '',
      paymentStatus: calculatePaymentStatus(
        inventory.grandTotal,
        paymentData.cashAmount || 0,
        paymentData.creditAmount || 0
      ),
      remainingBalance: calculateRemainingBalance(
        inventory.grandTotal,
        paymentData.cashAmount || 0,
        paymentData.creditAmount || 0
      ),
      updatedAt: new Date()
    };
    
    const TemporaryPayment = mongoose.model('TemporaryPayment', new mongoose.Schema({}, { strict: false }));
    const payment = await TemporaryPayment.findOneAndUpdate(
      { referenceId: inventoryId },
      updatedPaymentData,
      { new: true }
    );
    
    return {
      inventory,
      payment,
      message: "Payment information updated successfully"
    };
    
  } catch (error) {
    throw new Error(`Failed to update payment: ${error.message}`);
  }
};
