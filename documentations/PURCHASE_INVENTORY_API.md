# Purchase Entry and Inventory Management API Documentation

This document provides comprehensive API documentation for the Purchase Entry and Inventory Management system implemented for the DoseLogix medicine distribution application.

## Overview

The system consists of three main models:
1. **PurchaseEntry** - Records purchase transactions from suppliers
2. **PurchaseProduct** - Individual products within a purchase entry with batch details
3. **Inventory** - Current stock levels and batch tracking

## Authentication

All endpoints require JWT authentication and multi-tenant middleware. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Base URL
```
http://localhost:4000/api
```

---

# Purchase Entry API

## Endpoints

### 1. Create Purchase Entry
**POST** `/purchase-entries`

Creates a new purchase entry with automatic inventory updates.

**Request Body:**
```json
{
  "brandId": "60d5ecb74bb24c001f8b4567",
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15T00:00:00.000Z",
  "date": "2024-01-15T00:00:00.000Z",
  "grossTotal": 150000,
  "freight": 5000,
  "flatDiscount": 2500,
  "specialDiscount": 1000,
  "grandTotal": 151500,
  "cashPaid": 50000,
  "creditAmount": 101500,
  "remarks": "First quarter medicine purchase",
  "paymentDetails": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "amountPaid": 25000
    }
  ],
  "products": [
    {
      "productId": "60d5ecb74bb24c001f8b4568",
      "batchNumber": "BATCH001",
      "expiryDate": "2025-01-15T00:00:00.000Z",
      "cartons": 10,
      "pieces": 50,
      "bonus": 5,
      "netPrice": 1500,
      "discount": 5,
      "discountType": "percentage",
      "salePrice": 1800,
      "minSalePrice": 1700,
      "retailPrice": 2000,
      "invoicePrice": 1600
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "_id": "60d5ecb74bb24c001f8b4569",
    "vendorId": "60d5ecb74bb24c001f8b4567",
    "brandId": "60d5ecb74bb24c001f8b4567",
    "invoiceNumber": "INV-2024-001",
    "grossTotal": 150000,
    "grandTotal": 151500,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Purchase entry created successfully"
}
```

### 2. Get All Purchase Entries
**GET** `/purchase-entries`

Retrieves purchase entries with pagination and filtering.

**Query Parameters:**
- `pageNumber` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)
- `keyword` (optional): Search in invoice number or remarks
- `status` (optional): "Active" or "Inactive"
- `brandId` (optional): Filter by brand
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "result": {
    "docs": [...],
    "totalDocs": 25,
    "limit": 10,
    "page": 1,
    "totalPages": 3,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  },
  "message": "Purchase entries retrieved successfully"
}
```

### 3. Get Purchase Entry by ID
**GET** `/purchase-entries/:id`

Retrieves a specific purchase entry.

### 4. Update Purchase Entry
**PUT** `/purchase-entries/:id`

Updates an existing purchase entry.

### 5. Delete Purchase Entry
**DELETE** `/purchase-entries/:id`

Deletes a purchase entry and reverses inventory changes.

### 6. Toggle Purchase Entry Status
**PATCH** `/purchase-entries/:id/toggle-status`

Toggles the active status of a purchase entry.

### 7. Get Purchase Entries by Date Range
**GET** `/purchase-entries/date-range`

**Query Parameters:**
- `startDate`: Start date (required)
- `endDate`: End date (required)
- `brandId` (optional): Filter by brand
- `isActive` (optional): Filter by active status

### 8. Get Purchase Statistics
**GET** `/purchase-entries/stats`

**Query Parameters:**
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "result": {
    "totalEntries": 15,
    "totalGrossAmount": 2500000,
    "totalGrandAmount": 2650000,
    "totalPaid": 1800000,
    "totalFreight": 75000,
    "totalDiscounts": 100000
  },
  "message": "Purchase statistics retrieved successfully"
}
```

---

# Purchase Product API

## Endpoints

### 1. Create Purchase Product
**POST** `/purchase-products`

Creates a new purchase product within a purchase entry.

### 2. Get All Purchase Products
**GET** `/purchase-products`

**Query Parameters:**
- `pageNumber`, `pageSize`, `keyword`, `status`
- `productId`, `purchaseEntryId`, `batchNumber`

### 3. Get Purchase Products by Entry
**GET** `/purchase-products/entry/:purchaseEntryId`

### 4. Get Purchase Products by Product
**GET** `/purchase-products/product/:productId`

**Query Parameters:**
- `isActive`, `batchNumber`, `expiryBefore`, `expiryAfter`

### 5. Get Expiring Purchase Products
**GET** `/purchase-products/expiring`

**Query Parameters:**
- `daysFromNow` (optional, default: 90)

### 6. Get Product Purchase History
**GET** `/purchase-products/history/:productId`

**Query Parameters:**
- `startDate`, `endDate`

### 7. Get Batch Details
**GET** `/purchase-products/batch/:productId/:batchNumber`

### 8. Update Purchase Product
**PUT** `/purchase-products/:id`

### 9. Delete Purchase Product
**DELETE** `/purchase-products/:id`

### 10. Toggle Purchase Product Status
**PATCH** `/purchase-products/:id/toggle-status`

---

# Inventory API

## Endpoints

### 1. Create Inventory Item
**POST** `/inventory`

### 2. Get All Inventory
**GET** `/inventory`

**Query Parameters:**
- `pageNumber`, `pageSize`, `keyword`, `status`
- `productId`, `batchNumber`, `stockStatus` ("out_of_stock", "low_stock", "in_stock", "reserved")

### 3. Get Inventory by Product
**GET** `/inventory/product/:productId`

### 4. Get Low Stock Items
**GET** `/inventory/low-stock`

**Query Parameters:**
- `threshold` (optional, default: 10)

### 5. Get Out of Stock Items
**GET** `/inventory/out-of-stock`

### 6. Get Expiring Products
**GET** `/inventory/expiring`

**Query Parameters:**
- `daysFromNow` (optional, default: 90)

### 7. Get Expired Products
**GET** `/inventory/expired`

### 8. Get Inventory Summary
**GET** `/inventory/summary`

**Response:**
```json
{
  "success": true,
  "result": {
    "totalProducts": 25,
    "totalBatches": 45,
    "totalQuantity": 15000,
    "totalReserved": 500,
    "availableQuantity": 14500,
    "lowStockCount": 5,
    "outOfStockCount": 2,
    "expiringSoonCount": 3
  },
  "message": "Inventory summary retrieved successfully"
}
```

### 9. Get Inventory Value
**GET** `/inventory/value`

**Response:**
```json
{
  "success": true,
  "result": {
    "totalValueByCost": 2500000,
    "totalValueBySale": 3000000,
    "totalValueByRetail": 3500000
  },
  "message": "Inventory value retrieved successfully"
}
```

### 10. Reserve Stock
**POST** `/inventory/reserve`

**Request Body:**
```json
{
  "productId": "60d5ecb74bb24c001f8b4568",
  "batchNumber": "BATCH001",
  "quantity": 100
}
```

### 11. Release Reserved Stock
**POST** `/inventory/release`

**Request Body:**
```json
{
  "productId": "60d5ecb74bb24c001f8b4568",
  "batchNumber": "BATCH001",
  "quantity": 50
}
```

### 12. Update Stock
**POST** `/inventory/update-stock`

**Request Body:**
```json
{
  "productId": "60d5ecb74bb24c001f8b4568",
  "batchNumber": "BATCH001",
  "quantityChange": 200,
  "operation": "add" // or "subtract"
}
```

### 13. Adjust Inventory
**PATCH** `/inventory/:id/adjust`

**Request Body:**
```json
{
  "adjustmentType": "add", // or "subtract"
  "quantity": 50,
  "reason": "Stock adjustment for damaged goods"
}
```

### 14. Update Inventory Item
**PUT** `/inventory/:id`

### 15. Delete Inventory Item
**DELETE** `/inventory/:id`

### 16. Toggle Inventory Status
**PATCH** `/inventory/:id/toggle-status`

---

# Data Models

## PurchaseEntry Model
```javascript
{
  vendorId: ObjectId, // Reference to User
  brandId: ObjectId, // Reference to Brand
  date: Date,
  invoiceNumber: String, // Unique per vendor
  invoiceDate: Date,
  lastInvoiceNumber: String,
  lastInvoicePrice: Number,
  grossTotal: Number,
  freight: Number,
  flatDiscount: Number,
  specialDiscount: Number,
  remarks: String,
  grandTotal: Number,
  cashPaid: Number,
  creditAmount: Number,
  paymentDetails: [{
    date: Date,
    amountPaid: Number
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## PurchaseProduct Model
```javascript
{
  purchaseEntryId: ObjectId, // Reference to PurchaseEntry
  productId: ObjectId, // Reference to Product
  vendorId: ObjectId, // Reference to User
  batchNumber: String,
  expiryDate: Date,
  cartons: Number,
  pieces: Number,
  quantity: Number, // Calculated: cartons + pieces
  bonus: Number,
  netPrice: Number,
  discount: Number,
  discountType: String, // 'percentage' or 'flat'
  effectiveCostPerPiece: Number, // Calculated
  totalAmount: Number, // Calculated
  salePrice: Number,
  minSalePrice: Number,
  retailPrice: Number,
  invoicePrice: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Inventory Model
```javascript
{
  vendorId: ObjectId, // Reference to User
  productId: ObjectId, // Reference to Product
  batchNumber: String,
  expiryDate: Date,
  currentQuantity: Number,
  reservedQuantity: Number,
  lastPurchasePrice: Number,
  averageCost: Number,
  salePrice: Number,
  minSalePrice: Number,
  retailPrice: Number,
  invoicePrice: Number,
  isActive: Boolean,
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

# Error Handling

All endpoints return errors in the following format:
```json
{
  "success": false,
  "result": null,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

---

# Business Logic

## Calculations

### Purchase Product Calculations
- `totalQuantity = cartons + pieces`
- `grossAmount = totalQuantity * netPrice`
- `discountAmount = grossAmount * (discount/100)` (if percentage) or flat amount
- `totalAmount = grossAmount - discountAmount`
- `effectiveCostPerPiece = totalAmount / (totalQuantity + bonus)`

### Purchase Entry Calculations
- `grandTotal = grossTotal + freight - flatDiscount - specialDiscount`
- `creditAmount = grandTotal - cashPaid`
- `totalPaid = cashPaid + sum(paymentDetails.amountPaid)`
- `remainingBalance = grandTotal - totalPaid`

### Inventory Calculations
- `availableQuantity = currentQuantity - reservedQuantity`
- Stock Status: "Out of Stock", "Low Stock", "In Stock", "Reserved"
- Expiry Status: "Expired", "Expiring Soon", "Near Expiry", "Valid"

## Data Integrity

- **Transactions**: All purchase entry operations use MongoDB transactions
- **Unique Constraints**: Invoice numbers unique per vendor, batch numbers unique per product per vendor
- **Referential Integrity**: All references validated before operations
- **Automatic Updates**: Inventory automatically updated on purchase entry/product creation/deletion

## Validation Rules

- All required fields validated
- Date validations for expiry and invoice dates
- Numeric validations for prices and quantities
- String length validations
- Duplicate prevention for critical fields

---

# Usage Examples

## Creating a Complete Purchase Entry

1. **Create Purchase Entry** with products array
2. **System automatically**:
   - Validates all data
   - Creates PurchaseProduct records
   - Updates/Creates Inventory records
   - Calculates all derived fields

## Managing Inventory

1. **Reserve stock** before sales
2. **Update stock** when receiving new shipments
3. **Monitor low stock** and expiring products
4. **Adjust inventory** for damaged/lost goods

## Reporting

1. **Purchase statistics** by date range
2. **Inventory summary** and valuation
3. **Product purchase history**
4. **Expiring products** alerts

---

This API provides a complete purchase entry and inventory management solution with proper data integrity, validation, and business logic implementation.
