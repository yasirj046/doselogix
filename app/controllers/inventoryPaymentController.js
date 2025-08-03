const inventoryPaymentService = require("../services/inventoryPaymentService");
const util = require("../util/util");

// PIS Implementation - Combined Inventory + Payment Controller

// Create inventory with payment (PIS approach)
exports.createInventoryWithPayment = async (req, res) => {
  try {
    const { inventoryData, paymentData } = req.body;
    
    // Validate required data
    if (!inventoryData || !inventoryData.products || inventoryData.products.length === 0) {
      return res.status(200).json(
        util.createResponse(null, { message: "Inventory data with products is required" })
      );
    }
    
    // Create combined data object
    const combinedData = {
      inventoryData: {
        date: inventoryData.date,
        brandId: inventoryData.brandId,
        brandInvoice: inventoryData.brandInvoice,
        brandInvoiceDate: inventoryData.brandInvoiceDate,
        products: inventoryData.products,
        flatDiscount: inventoryData.flatDiscount || 0,
        specialDiscountPercentage: inventoryData.specialDiscountPercentage || 0,
        freight: inventoryData.freight || 0,
        remarksForInvoice: inventoryData.remarksForInvoice || ""
      },
      paymentData: {
        cashAmount: paymentData?.cashAmount || 0,
        creditAmount: paymentData?.creditAmount || 0,
        paymentNotes: paymentData?.paymentNotes || "",
        paymentDate: paymentData?.paymentDate || new Date()
      }
    };
    
    const result = await inventoryPaymentService.createInventoryWithPayment(combinedData);
    
    res.status(201).json(
      util.createResponse(result, null, "Inventory and payment created successfully")
    );
    
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Get inventory with payment details
exports.getInventoryWithPayment = async (req, res) => {
  try {
    const result = await inventoryPaymentService.getInventoryWithPayment(req.params.id);
    
    res.status(200).json(
      util.createResponse(result, null, "Inventory with payment retrieved successfully")
    );
    
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};

// Update payment information for existing inventory
exports.updateInventoryPayment = async (req, res) => {
  try {
    const result = await inventoryPaymentService.updateInventoryPayment(req.params.id, req.body);
    
    res.status(200).json(
      util.createResponse(result, null, "Payment information updated successfully")
    );
    
  } catch (error) {
    res.status(200).json(
      util.createResponse(null, error)
    );
  }
};
