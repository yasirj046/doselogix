# Expenses Module Documentation

## Overview

The Expenses module is designed to manage operational costs for vendors in the DoseLogix system. It allows vendors to track, categorize, and analyze their business expenses with comprehensive filtering, reporting, and statistical capabilities.

## Database Schema

### Expense Model

**Collection Name:** `expenses`

**Fields:**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `vendorId` | ObjectId | Yes | Reference to User (vendor) | Must be valid ObjectId, indexed |
| `date` | Date | Yes | Date of the expense | Must be valid date, indexed |
| `expenseCategory` | String | Yes | Category of expense | Must be from predefined enum, indexed |
| `description` | String | Yes | Detailed description of expense | Max 500 characters, trimmed |
| `amount` | Number | Yes | Expense amount | Min 0.01, max 2 decimal places |
| `isActive` | Boolean | No | Active status of expense | Default: true, indexed |
| `createdAt` | Date | Auto | Record creation timestamp | Automatically managed |
| `updatedAt` | Date | Auto | Record update timestamp | Automatically managed |

**Indexes:**
- `{ vendorId: 1, date: -1 }`
- `{ vendorId: 1, expenseCategory: 1 }`
- `{ vendorId: 1, isActive: 1 }`
- `{ vendorId: 1, createdAt: -1 }`
- `{ vendorId: 1 }` (single field)
- `{ date: 1 }` (single field)
- `{ expenseCategory: 1 }` (single field)
- `{ isActive: 1 }` (single field)

**Virtual Fields:**
- `formattedDate`: Returns date in YYYY-MM-DD format
- `formattedAmount`: Returns amount with 2 decimal places

## Relationships

### Vendor Relationship
- **Type:** One-to-Many (User → Expenses)
- **Reference Field:** `vendorId` → `User._id`
- **Population:** Automatically populated in queries with `vendorName` and `vendorEmail`

### Multi-Tenancy
- All expense operations are scoped to the authenticated vendor
- Middleware ensures vendors can only access their own expenses
- No cross-vendor data access allowed

## Constants and Enums

### Expense Categories

**File:** `app/constants/expenseCategories.js`

**Available Categories:**
```javascript
const EXPENSE_CATEGORIES = [
  { label: 'Supplies', value: 'Supplies' },
  { label: 'Utilities', value: 'Utilities' },
  { label: 'Fuel', value: 'Fuel' },
  { label: 'Food', value: 'Food' },
  { label: 'Equipment', value: 'Equipment' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Communication', value: 'Communication' },
  { label: 'Rent', value: 'Rent' },
  { label: 'Miscellaneous', value: 'Miscellaneous' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Water', value: 'Water' },
  { label: 'Internet', value: 'Internet' },
];
```

**Enum Array:**
```javascript
const EXPENSE_CATEGORY_ENUM = [
  'Supplies', 'Utilities', 'Fuel', 'Food', 'Equipment',
  'Maintenance', 'Communication', 'Rent', 'Miscellaneous',
  'Electricity', 'Water', 'Internet'
];
```

## API Endpoints

**Base URL:** `/api/expenses`

**Authentication:** All endpoints require JWT authentication and multi-tenancy middleware.

### 1. Create Expense
**Endpoint:** `POST /api/expenses`

**Request Body:**
```json
{
  "date": "2025-10-19",
  "expenseCategory": "Supplies",
  "description": "Office stationery purchase",
  "amount": 150.50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "expense_id",
    "vendorId": {
      "_id": "vendor_id",
      "vendorName": "Vendor Name",
      "vendorEmail": "vendor@example.com"
    },
    "date": "2025-10-19T00:00:00.000Z",
    "expenseCategory": "Supplies",
    "description": "Office stationery purchase",
    "amount": 150.5,
    "isActive": true,
    "createdAt": "2025-10-19T10:00:00.000Z",
    "updatedAt": "2025-10-19T10:00:00.000Z",
    "formattedDate": "2025-10-19",
    "formattedAmount": "150.50"
  },
  "message": "Expense created successfully"
}
```

### 2. Get All Expenses
**Endpoint:** `GET /api/expenses`

**Query Parameters:**
- `pageNumber` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)
- `keyword` (optional): Search in description and category
- `status` (optional): Filter by status ("Active" or "Inactive")
- `expenseCategory` (optional): Filter by specific category
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Example:** `GET /api/expenses?pageNumber=1&pageSize=10&expenseCategory=Supplies&startDate=2025-01-01`

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [...],
    "totalDocs": 150,
    "limit": 10,
    "totalPages": 15,
    "page": 1,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  },
  "message": "Expenses retrieved successfully"
}
```

### 3. Get Expense by ID
**Endpoint:** `GET /api/expenses/:id`

**Response:** Single expense object (same format as create response)

### 4. Update Expense
**Endpoint:** `PUT /api/expenses/:id`

**Request Body:** Same as create, all fields optional

**Response:** Updated expense object

### 5. Delete Expense
**Endpoint:** `DELETE /api/expenses/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Expense deleted successfully"
  },
  "message": "Expense deleted successfully"
}
```

### 6. Toggle Expense Status
**Endpoint:** `PATCH /api/expenses/:id/toggle-status`

**Response:** Updated expense object with toggled `isActive` status

### 7. Get My Expenses
**Endpoint:** `GET /api/expenses/my/expenses`

**Query Parameters:** Same as getAllExpenses

**Description:** Returns only expenses belonging to the authenticated vendor

### 8. Get Expense Statistics
**Endpoint:** `GET /api/expenses/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 150,
    "totalAmount": 25000.50,
    "expensesByCategory": [
      {
        "_id": "Supplies",
        "count": 45,
        "totalAmount": 7500.25
      }
    ],
    "monthlyExpenses": [
      {
        "_id": 10,
        "count": 25,
        "totalAmount": 4200.75
      }
    ]
  },
  "message": "Expense statistics retrieved successfully"
}
```

### 9. Get Expense Categories
**Endpoint:** `GET /api/expenses/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    "Supplies", "Utilities", "Fuel", "Food", "Equipment",
    "Maintenance", "Communication", "Rent", "Miscellaneous",
    "Electricity", "Water", "Internet"
  ],
  "message": "Expense categories retrieved successfully"
}
```

### 10. Get Expenses by Category
**Endpoint:** `GET /api/expenses/category/:expenseCategory`

**Query Parameters:** `pageNumber`, `pageSize`

**Example:** `GET /api/expenses/category/Supplies?pageNumber=1&pageSize=20`

### 11. Get Expenses by Date Range
**Endpoint:** `GET /api/expenses/date-range`

**Query Parameters:**
- `startDate` (required if endDate provided)
- `endDate` (required if startDate provided)
- `pageNumber`, `pageSize`

**Example:** `GET /api/expenses/date-range?startDate=2025-01-01&endDate=2025-12-31`

## Filtering and Search Capabilities

### Available Filters:
1. **Keyword Search:** Searches in `description` and `expenseCategory` fields
2. **Status Filter:** Filter by `isActive` status ("Active"/"Inactive")
3. **Category Filter:** Filter by specific expense category
4. **Date Range Filter:** Filter by date range (startDate to endDate)
5. **Pagination:** Standard pagination with page number and page size

### Search Examples:
- Search for "office": `?keyword=office`
- Active expenses only: `?status=Active`
- Supplies category: `?expenseCategory=Supplies`
- October 2025: `?startDate=2025-10-01&endDate=2025-10-31`
- Combined: `?keyword=printer&expenseCategory=Supplies&status=Active`

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

## Error Handling

### Common Error Scenarios:

1. **Validation Errors:**
   - Missing required fields
   - Invalid date format
   - Invalid amount (negative or non-numeric)
   - Invalid expense category
   - Description too long (>500 characters)

2. **Authorization Errors:**
   - Missing or invalid JWT token
   - Attempting to access other vendor's expenses

3. **Not Found Errors:**
   - Expense ID not found
   - Expense belongs to different vendor

4. **Database Errors:**
   - Connection issues
   - Duplicate entries (handled gracefully)

### Error Response Codes:
- `200`: Success (following project convention)
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate data)

## File Structure

```
app/
├── constants/
│   └── expenseCategories.js          # Expense category constants
├── controllers/
│   └── expenseController.js          # API endpoint handlers
├── models/
│   └── expenseModel.js               # Mongoose schema and model
├── routes/
│   └── expenseRoute.js               # Route definitions
├── services/
│   └── expenseService.js             # Business logic layer
└── seed/
    └── expenseSeeder.js              # Data seeding script
```

## Variable Naming Conventions

Following the established patterns in the codebase:

- **Models:** PascalCase (e.g., `Expense`)
- **Controllers:** camelCase with 'Controller' suffix (e.g., `expenseController`)
- **Services:** camelCase with 'Service' suffix (e.g., `expenseService`)
- **Routes:** camelCase with 'Route' suffix (e.g., `expenseRoute`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `EXPENSE_CATEGORIES`)
- **Enums:** UPPER_SNAKE_CASE with '_ENUM' suffix (e.g., `EXPENSE_CATEGORY_ENUM`)
- **Database Fields:** camelCase (e.g., `vendorId`, `expenseCategory`)
- **API Endpoints:** kebab-case (e.g., `/api/expenses`)

## Performance Considerations

1. **Indexing:** Multiple compound indexes for efficient querying
2. **Pagination:** Built-in pagination to handle large datasets
3. **Vendor Scoping:** All queries filtered by vendor ID for security and performance
4. **Date Indexing:** Optimized for date range queries
5. **Category Indexing:** Fast filtering by expense categories

## Data Validation

- **Server-side validation** for all inputs
- **Enum validation** for expense categories
- **Type validation** for amounts and dates
- **Length validation** for text fields
- **Range validation** for numeric fields

## Security Features

- **JWT Authentication** required for all endpoints
- **Multi-tenancy** ensures vendor data isolation
- **Input sanitization** and validation
- **SQL injection prevention** through parameterized queries
- **XSS protection** through input trimming and validation

---

**Last Updated:** October 19, 2025
**Version:** 1.0.0
**Module:** Expenses Management
