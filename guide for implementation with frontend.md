# Frontend Implementation Guide for Pharmaceutical DMS

## 🎯 **Project Overview**

**AI-Powered Pharmaceutical Distribution Management System (DMS)** is a comprehensive backend system for managing pharmaceutical distribution with automated notifications, financial tracking, and delivery management. This guide provides complete frontend implementation steps based on the fully-integrated backend system.

## 📋 **Module Implementation Status**

### **✅ Completed Modules**
- ✅ **LoginForm Component** - Email validation, loading states, error handling
- ✅ **CompanyRegistrationForm Component** - Single-step registration (no OTP verification)  
- ✅ **ForgotPasswordForm Component** - Password reset with OTP workflow
- ✅ **Dashboard Component** - Main landing page with stats and navigation


---

## 🚀 Module Frontend Specifications (Revised)

### **Employees Module**
- All fields from backend are displayed in the list and export.
- Search bar for quick lookup by name, CNIC, or phone.
- Filters for all fields, including status (active/inactive/both; default: active).
- Add/Edit: Adding opens a modal (all fields, status defaults to active). Editing opens a modal with all fields editable, including status.
- Soft delete: Deleted employees can be restored. Deletion requires confirmation modal.
- Bulk delete supported.
- Export: All fields exported (Excel/PDF).
- Clicking an employee opens a profile view (readable and editable via modal).
- Only admin can see all data; otherwise, user sees only their own data.
- Mobile responsive, modal dialogs for all actions (success, error, failure).

### **Customer Registration**
- All fields from backend are displayed in the list and export.
- Filters for all fields, including registration number/customer ID and status (active/inactive/both; default: active).
- Search bar for all fields.
- Pagination for customer list.
- Add/Edit: Adding opens a modal (all fields, status defaults to active). Editing opens a modal with all fields editable, including status.
- Customer status is editable after registration.
- No detailed profile page; list view is sufficient.
- Under each customer name, show balance and last order amount (real-time updates).
- Bulk delete supported.
- Export: Only registration fields (not order/balance info).
- Only admin can see all data; otherwise, user sees only their own data.
- Mobile responsive, modal dialogs for all actions (success, error, failure).


### **Product Registration**
- All fields from backend are displayed in the list and export.
- Products are linked to their groups/subgroups (displayed and filterable).
- Filters for all fields, including status (active/inactive/both; default: active).
- Product list is sorted by product ID by default; filters can be applied.
- Add/Edit: Adding opens a modal (all fields, status defaults to active). Editing opens a modal with all fields editable, including status.
- Inline view for quick edits; modal for add/edit.
- Bulk delete supported (confirmation modal required).
- Export: Product fields with group and sub-group info.
- Only admin can see all data; otherwise, user sees only their own data.
- Mobile responsive, modal dialogs for all actions (success, error, failure).

---

### **Inventory Management Module – Frontend Specification (Revised)**

#### **Filter UX (All Modules)**
- All filters open a dropdown of user-specific records when clicked.
- User can type to narrow down options.
- The first row is always "Select" (unselects that filter).
- "Clear All" option resets all filters.
- Filters are always visible and accessible.

#### **Inventory Management – Add/Edit Flow**
- All fields are mandatory (except userId, which is handled by the platform).
- Adding inventory opens a new window (not a modal).
- **Header Section:** Input all header fields (from backend, except userId).
- **Product Entry Row:** Below header, a row for entering all inventory fields for a product (e.g., Panadol, batch, expiry, etc.).
  - User can press "Enter" or click "Add Product" to add the row to the inventory list below.
  - All fields must pass validation before adding.
  - After adding, entry fields are cleared for the next product.
- **Inventory List Table:** Shows all products added in this session.
- **Footer Section:** Input any required footer details.
- **Save/Cancel:** Save posts the entire inventory record (header, all products, footer) to backend. Cancel discards all changes.

#### **Stock Update Logic**
- When an inventory record is saved, the stock for each medicine/product is automatically updated in the backend.
- No manual stock update required by user.
- (Recommendation: This should be handled in backend for data integrity. Frontend only sends the full inventory record.)


#### **Batch Handling & Schema (Backend/Frontend Alignment)**
- **Multiple batches per product are now fully supported.**
- **Backend Schema:** Each product in inventory uses a `batches` array, where each batch has:
  - `batchNumber` (string, required)
  - `expiry` (date, required)
  - `quantity` (number, required)
  - `unitPrice` (number, required)
  - `mrp` (number, optional)
  - `manufacturer` (string, optional)
  - `alerts` (array, auto-generated, see below)
- **Frontend:**
  - When adding/editing inventory, user can add multiple batches per product (each with its own batch number, expiry, quantity, price, etc.).
  - All batch fields are validated before adding.
  - FEFO (First Expiry First Out) logic is used for stock deduction and display.
  - Batch details are shown in all relevant tables and modals.
- **Data Migration:** Any legacy inventory data must be migrated to the new `batches` array structure for full compatibility.

#### **Batch-Level Notification & Alert Logic**
- **Backend:**
  - Notification/alert logic is now batch-aware. The backend scans all batches for:
    - **Low Stock:** If a batch's quantity falls below the configured threshold, a low stock alert is generated for that batch.
    - **Expiry:**
      - **Expiring Soon:** If a batch is within the expiry warning window (e.g., 30 days), an expiring soon alert is generated.
      - **Expired:** If a batch is past its expiry date, an expired alert is generated.
  - Alerts are generated per batch, not per product.
  - Alerts are stored and served via `/api/inventory/low-stock`, `/api/inventory/expiring-soon`, and `/api/inventory/expired` endpoints, each returning batch-level details (product, batch number, expiry, quantity, etc.).
  - Notification records reference the specific batch and product.
- **Frontend:**
  - Inventory and notification UIs display batch-level alerts (e.g., "Batch #1234 of Panadol expiring in 10 days").
  - Visual indicators (color, icons) for low stock, expiring soon, and expired batches.
  - Batch-level alerts are filterable and exportable.
  - All batch alert endpoints are consumed for real-time display.

#### **API Endpoints (Batch-Aware)**
- `/api/inventory/low-stock` — Returns all batches with low stock (fields: product, batchNumber, expiry, quantity, threshold, etc.)
- `/api/inventory/expiring-soon` — Returns all batches expiring within the warning window
- `/api/inventory/expired` — Returns all expired batches
- All endpoints return batch-level data for full frontend alignment.

#### **Frontend Implementation Notes (Batch & Alerts)**
- All inventory add/edit forms support multiple batches per product.
- Medicines tab and inventory tables show all batches for each product (expand/collapse or flat list as needed).
- Alerts/notifications are shown at the batch level, with clear product/batch/expiry/quantity info.
- FEFO logic is used for stock deduction and display (oldest unexpired batch is used first).
- Export and search features include batch-level data and alerts.



#### **Tabbed Interface (Purchasing Receipts & Medicines)**
- Top left of Inventory Management page: Two tabs – **"Purchasing Receipts"** (default) and **"Medicines"**.
- **Purchasing Receipts Tab:**
  - Shows inventory purchasing records (receipt number, brand, total amount, discount, credit, debit, etc.).
  - Each record has a delete button and an export button (Excel/PDF) at the end.
  - No soft delete/restore, only hard delete.
  - All actions are for the current user/admin only.
- **Medicines Tab:**
  - Shows all medicines in inventory, grouped by product, with all batches visible (expand/collapse or flat list).
  - Each batch row shows: batch number, expiry, quantity, unit price, alerts (low stock/expiring/expired), etc.
  - No "Add" button in this tab (read-only).
  - Data is read-only, for quick lookup and batch-level alert review.
- By default, page opens to **"Purchasing Receipts"** tab.


#### **Other Rules**
- Only delete (no soft delete/restore).
- Export button at the end of each invoice record.
- All actions are for a single user/admin.
- Mobile responsive, modal dialogs for all actions (success, error, failure).
- Bulk delete, search, and filters as per general UI/UX rules.
- **Batch-level alerts and notifications are always visible and filterable in all relevant tables and modals.**

#### **Backend Clarifications Needed**
- Confirm backend support for:
  - Multiple batches per product in inventory records.
  - Tabbed data structure for invoices/products in inventory management (or if additional endpoints are needed).
  - All required fields for invoice and product records in inventory.

---

### **General UI/UX Rules for All Modules**
- Modal dialogs for all add/edit/delete actions, showing success, error, or failure (see LoginForm for modal style).
- Mobile responsive design throughout the app.
- Filters for all fields, including status (active/inactive/both; default: active).
- Export button for exporting data (Excel/PDF) in every module.
- Bulk delete supported in all modules (confirmation modal required).
- Only admin can see all data; otherwise, user sees only their own data.

---

### **Next Steps**
Modules updated. Please specify the next modules to revise, or clarify any further requirements for these modules.

### **🎯 Next Steps**
Our process: Ask specific questions about each module's frontend behavior → Add detailed specifications → Move to next module.

**Current Target**: Inventory Management Module (Next questions coming up!)

## 📋 **Module Implementation Status**

### **✅ Completed Modules**
- ✅ **LoginForm Component** - Email validation, loading states, error handling
- ✅ **CompanyRegistrationForm Component** - Single-step registration (no OTP verification)  
- ✅ **ForgotPasswordForm Component** - Password reset with OTP workflow
- ✅ **Dashboard Component** - Main landing page with stats and navigation

### **🚀 Ready to Implement (Backend Complete)**
- 📦 **Inventory Management Module** - Add/edit products, stock tracking, alerts
- 📄 **Invoice Management Module** - Create invoices, payment tracking, calculations
- 👥 **Customer Management Module** - Customer CRUD, order history, credit tracking
- 👤 **User Management Module** - Admin-only user roles and permissions
- 💰 **Financial Ledger Module** - Transaction tracking, financial reports, payables/receivables/expenses submenus, balance account summary
- ⚙️ **Settings Management Module** - Company settings, notifications, backup
- 🚚 **Delivery Management Module** - Delivery assignments, tracking, status updates
- 🔔 **Notification Center Module** - In-app notifications, preferences, alerts

### **🎯 Next Steps**
Our process: Ask specific questions about each module's frontend behavior → Add detailed specifications → Move to next module.

**Current Target**: Inventory Management Module (Next questions coming up!)

---

## 🏢 **Multi-Tenant Architecture Specification**

### **Data Isolation Model: Complete Separation**
```javascript
// Each company has completely isolated data
Company: "Yasir Medicine Company" (Company ID: yasir-med-001)
Company: "Younas Medicine Company" (Company ID: younas-med-002)  
Company: "ABC Pharmaceuticals" (Company ID: abc-pharma-003)

// Zero data sharing between companies
Yasir Medicine Company sees ONLY:
- Their own inventory items
- Their own invoices and customers
- Their own financial records
- Their own delivery assignments
- Their own user accounts
- Their own notifications
- Their own system settings

// No company can access another company's data
// Critical security requirement for pharmaceutical distribution
```

### **Registration & Authentication Flow**
```javascript
// Self-Registration Process (Simplified - No OTP):
1. User visits registration page (/register)
2. Single form: Company name, phone, email, license number, license expiry, password
3. Email must be exactly @gmail.com or @outlook.com
4. All fields except license expiry and password are unique
5. User submits form and is immediately registered (no verification needed)
6. User becomes company admin upon successful registration
7. Redirect to login page to sign in

// Login Process:
1. User enters email + password at /login
2. System auto-detects company from email
3. User sees only their company's data
4. All API calls filtered by company ID automatically

// Super Admin Access:
- Route: /admin for super admin login only
- Same interface + additional features
- Can view all companies' data via company selector
```

## 📧 **Email/OTP Verification Workflow**

### **Development vs Production Email Handling**

#### **🛠️ Development Mode (Current Setup)**
```javascript
// Email Configuration (.env)
NODE_ENV=development
EMAIL_ENABLED=false  // Disables actual email sending

// What Happens During Development:
1. User registers company → OTP generated
2. Console logs show simulated email:
   "📧 EMAIL SIMULATION (Email disabled in development)
   To: company@example.com
   Subject: Verify Your Company Registration  
   Content: Your verification code is: 123456"
3. Developer extracts OTP from server logs
4. Use OTP in verification API call

// Console Output Example:
POST /api/companies/register 201 - Company registered
📧 EMAIL SIMULATION 
To: company@testpharma.com
Subject: Verify Your Company Registration
Content: Your verification code is: 622897. This code will expire in 10 minutes.
---
```

#### **🚀 Production Mode (Real Email)**
```javascript
// Email Configuration (.env) 
NODE_ENV=production
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-company@gmail.com
EMAIL_PASS=your-app-password

// What Happens in Production:
1. User registers company → OTP generated
2. Real email sent to user's inbox
3. User receives professional email with OTP
4. User enters OTP on verification page
5. Account activated automatically
```

### **Frontend Implementation (Solves All Testing Complexities)**

#### **❌ Current Testing Issues (Development Only)**
- Manual OTP extraction from server logs
- Complex PowerShell commands for API testing  
- Manual coordination between registration/verification endpoints
- No user-friendly interface

#### **✅ Frontend Solution (Production Ready)**
```javascript
// Registration Component
const RegisterCompany = () => {
  const [step, setStep] = useState(1); // 1: Register, 2: Verify
  const [companyEmail, setCompanyEmail] = useState('');
  
  const handleRegistration = async (formData) => {
    try {
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setCompanyEmail(formData.companyEmail);
        setStep(2); // Move to verification step
        showSuccessMessage('Check your email for verification code');
      }
    } catch (error) {
      showErrorMessage('Registration failed');
    }
  };
  
  const handleVerification = async (otp) => {
    try {
      const response = await fetch('/api/companies/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyEmail, otp })
      });
      
      if (response.ok) {
        showSuccessMessage('Company verified successfully!');
        router.push('/login'); // Redirect to login
      }
    } catch (error) {
      showErrorMessage('Invalid verification code');
    }
  };
  
  return (
    <div>
      {step === 1 && <RegistrationForm onSubmit={handleRegistration} />}
      {step === 2 && <VerificationForm onSubmit={handleVerification} />}
    </div>
  );
};

// Verification Component
const VerificationForm = ({ onSubmit }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  
  return (
    <div className="verification-container">
      <h2>Verify Your Email</h2>
      <p>Enter the 6-digit code sent to your email</p>
      
      <input 
        type="text" 
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
      />
      
      <button onClick={() => onSubmit(otp)}>
        Verify Company
      </button>
      
      <p>Code expires in: {Math.floor(timeLeft/60)}:{timeLeft%60}</p>
      <button onClick={handleResendOTP}>Resend Code</button>
    </div>
  );
};
```

### **Email Template (Production)**
```html
<!-- Auto-generated email template -->
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2>Welcome to DMS Platform</h2>
  <p>Thank you for registering your company: <strong>{{companyName}}</strong></p>
  
  <div style="background: #f5f5f5; padding: 20px; text-align: center;">
    <h3>Your Verification Code</h3>
    <div style="font-size: 32px; font-weight: bold; color: #2196F3;">
      {{otp}}
    </div>
  </div>
  
  <p><strong>Important:</strong> This code will expire in 10 minutes.</p>
  <p>If you didn't request this registration, please ignore this email.</p>
</div>
```

### **API Endpoints for Registration (No OTP)**
```javascript
// Company Registration (Direct Registration - No OTP)
POST /api/companies/register
Body: {
  companyName: "ABC Pharmaceuticals",
  companyEmail: "admin@abc-pharma.com",
  companyPhone: "+1234567890",
  // ... other fields
}
Response: {
  status: "success",
  message: "Company registered successfully! You can now login.",
  data: { companyId: "...", status: "active" }
}

// No verification endpoints needed
// Company is immediately active and ready for login
```

### **User Experience Flow (Simplified)**
```javascript
// Step-by-Step User Journey:
1. 📋 User fills registration form
   ↓
2. 📤 Frontend posts to /api/companies/register  
   ↓
3. 🎉 Company immediately registered and activated
   ↓
4. ✅ Admin user created automatically
   ↓
5. 🔑 User can immediately login with email/password
   ↓
6. 🏠 Redirect to login page

// Error Handling:
- Validation errors: Show field-specific errors
- Duplicate company: Show error message
- Network error: Show retry button
- Server error: Show generic error message
```

### **Testing in Development (Simplified)**
```javascript
// For developers testing the system:
1. Register company via frontend form
2. Company is immediately created and active
3. Admin user is automatically created
4. Test login with admin credentials immediately
5. No need to check server logs or handle OTP

// Much simpler development workflow!
// Frontend handles everything through standard form submission
```

### **⚠️ Development Database Issues (Resolved)**
```javascript
// Issue: MongoDB Index Conflicts During Development
// Cause: Legacy indexes from old schema versions
// Error: "E11000 duplicate key error collection: companies index: name_1"

// Solution Applied:
// 1. Dropped problematic indexes from MongoDB
// 2. Cleared test data to prevent conflicts
// 3. Server now starts cleanly with correct schema

// For Fresh Development Setup:
// If you encounter similar index errors:
// 1. Stop the server
// 2. Drop the problematic collection in MongoDB
// 3. Restart server (Mongoose will recreate with current schema)
// 4. Continue testing

// Production Note: This won't happen in production as schema is stable
````
````markdown
## 🎯 **API Endpoints Reference**

### **🏢 Multi-Tenant Company Routes**
```javascript
// Company Registration & Verification (Simplified - No OTP)
POST /api/companies/register          // Company registration (immediate activation)
GET  /api/companies/profile           // Get company profile (authenticated)
PUT  /api/companies/profile           // Update company profile (admin only)

// Super Admin Company Management  
POST /api/super-admin/login           // Super admin authentication
GET  /api/super-admin/companies       // List all companies
GET  /api/super-admin/companies/:id   // Get company details
PUT  /api/super-admin/companies/:id/status  // Update company status
DELETE /api/super-admin/companies/:id // Delete company
GET  /api/super-admin/dashboard/stats // Platform statistics
```

### **👤 User Management Routes**
```javascript
// Authentication (Company-scoped)
POST /api/users/login                 // User login (auto-detects company)
POST /api/users/register              // Register new user (admin only)

// Profile Management (Multi-tenant filtered)
GET  /api/users/profile               // Get user profile  
PUT  /api/users/profile               // Update user profile
POST /api/users/change-password       // Change password

// User Management (Admin functions, company-scoped)
GET  /api/users                       // Get all company users
GET  /api/users/:id                   // Get specific user details
PUT  /api/users/:id                   // Update user (admin only)
DELETE /api/users/:id                 // Delete user (admin only)
```

### **🔐 Password Reset Routes**
```javascript
// Password Reset Flow (Available)
POST /api/notifications/password-reset/send-otp    // Request password reset OTP
POST /api/notifications/password-reset/verify-otp  // Verify OTP and reset password
```

### **📋 Inventory Management Routes**
```javascript
// Stock Management (Company-scoped)
GET  /api/inventory                   // Get company inventory
POST /api/inventory                   // Add new inventory item
GET  /api/inventory/:id               // Get item details
PUT  /api/inventory/:id               // Update inventory item
DELETE /api/inventory/:id             // Delete inventory item

// Stock Operations
POST /api/inventory/:id/adjust        // Adjust stock quantity
GET  /api/inventory/low-stock         // Get low stock alerts
GET  /api/inventory/expired           // Get expired items
GET  /api/inventory/expiring-soon     // Get items expiring soon
```

### **📄 Invoice Management Routes**
```javascript
// Invoice Operations (Company-scoped)
GET  /api/invoices                    // Get company invoices
POST /api/invoices                    // Create new invoice
GET  /api/invoices/:id                // Get invoice details
PUT  /api/invoices/:id                // Update invoice
DELETE /api/invoices/:id              // Delete invoice

// Payment Management
PUT  /api/invoices/:id/payment        // Update payment status
GET  /api/invoices/overdue            // Get overdue invoices
GET  /api/invoices/stats              // Get invoice statistics
```

### **💰 Financial Ledger Routes**
```javascript
// Ledger Management (Company-scoped)
GET  /api/ledger                      // Get all ledger entries (paginated, filtered)
POST /api/ledger                      // Create ledger entry (payable, receivable, expense)
GET  /api/ledger/receivables          // Get accounts receivable (type: 'RECEIVABLE')
GET  /api/ledger/payables             // Get accounts payable (type: 'PAYABLE')
GET  /api/ledger/expenses             // Get expenses (type: 'EXPENSE')
GET  /api/ledger/financial-summary    // Get financial summary (total receivables, payables, expenses, balance)
PUT  /api/ledger/:id                  // Update ledger entry (edit)
DELETE /api/ledger/:id                // Soft delete ledger entry
GET  /api/ledger/by-source            // Get ledger entry by source document
```

### **🚚 Delivery Management Routes**
```javascript
// Delivery Operations (Company-scoped)
GET  /api/delivery-assignments        // Get delivery assignments
POST /api/delivery-assignments        // Create delivery assignment
GET  /api/delivery-assignments/:id    // Get assignment details
PUT  /api/delivery-assignments/:id    // Update assignment
PUT  /api/delivery-assignments/:id/status // Update delivery status
GET  /api/delivery-assignments/stats  // Get delivery statistics
```

### **🔔 Notification System Routes**
```javascript
// Notifications (Company-scoped)
GET  /api/notifications               // Get user notifications
POST /api/notifications/mark-read     // Mark notification as read
DELETE /api/notifications/:id         // Delete notification
GET  /api/notifications/unread-count  // Get unread count
GET  /api/notifications/preferences   // Get notification preferences
PUT  /api/notifications/preferences   // Update notification preferences
```

### **⚙️ Settings & Configuration Routes**
```javascript
// System Settings (Company-scoped)
GET  /api/settings                    // Get company settings
PUT  /api/settings                    // Update company settings
GET  /api/settings/backup             // Get backup settings
PUT  /api/settings/backup             // Update backup settings
GET  /api/settings/notifications      // Get notification settings
PUT  /api/settings/notifications      // Update notification settings
```

---

## 📱 **Frontend Component Specifications**

## 🔐 **Authentication Module**

### **1. LoginForm Component** ✅ **DEFINED**
```javascript
// Component Behavior Specification:
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Real-time Email Validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/i;
    return emailRegex.test(email);
  };

  // Handle email input with real-time validation
  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase();
    setEmail(value);
    
    // Real-time validation for email format
    if (value && !validateEmail(value)) {
      setErrors(prev => ({
        ...prev,
        email: 'Email must be @gmail.com or @outlook.com'
      }));
    } else {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  // Login submission with loading state validation
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validation during loading state
    const validationErrors = {};
    if (!validateEmail(email)) {
      validationErrors.email = 'Valid email required (@gmail.com or @outlook.com)';
    }
    if (!password) {
      validationErrors.password = 'Password is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      if (response.ok) {
        // Show success modal dialog
        showModalDialog({
          type: 'success',
          icon: '✅',
          message: 'Login successful! Redirecting...',
          autoClose: 2000
        });
        
        // Redirect after success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // Show error modal dialog
        showModalDialog({
          type: 'error', 
          icon: '❌',
          message: 'Invalid email or password'
        });
      }
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌', 
        message: 'Connection error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Company Branding */}
      <div className="company-brand">
        <img src="/company-logo.png" alt="DMS Platform" />
        <h1>Pharmaceutical DMS</h1>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        {/* Email Field */}
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="admin@yourcompany.com" 
            disabled={isLoading}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {/* Password Field with Toggle */}
        <div className="form-group">
          <label>Password</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              disabled={isLoading}
              className={errors.password ? 'error' : ''}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        {/* Remember Me Checkbox */}
        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            Remember Me
          </label>
          
          <a href="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </a>
        </div>

        {/* Login Button with Loading Spinner */}
        <button 
          type="submit" 
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Link to Registration */}
      <div className="register-link">
        Don't have an account? 
        <a href="/register">Register Your Company</a>
      </div>
    </div>
  );
};

// Modal Dialog Component for Success/Error Messages
const ModalDialog = ({ type, icon, message, autoClose, onClose }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div className="modal-overlay">
      <div className={`modal-dialog ${type}`}>
        <div className="modal-icon">{icon}</div>
        <div className="modal-message">{message}</div>
        {!autoClose && (
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
```

### **Visual Design Specifications:**
```css
/* Clean & Minimal Design with Company Branding */
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.company-brand {
  text-align: center;
  margin-bottom: 2rem;
}

.company-brand img {
  height: 60px;
  margin-bottom: 1rem;
}

.company-brand h1 {
  color: #1a365d; /* Navy Blue */
  font-size: 1.5rem;
  font-weight: 600;
}

.login-button {
  background: #1a365d; /* Navy Blue */
  color: white;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
}

.modal-dialog {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.modal-dialog.success {
  border-top: 4px solid #38a169; /* Green */
}

.modal-dialog.error {
  border-top: 4px solid #e53e3e; /* Red */
}
```

## 🔑 **Registration Module**

### **2. CompanyRegistrationForm Component** ✅ **DEFINED (Simplified - No OTP)**
```javascript
// Component Behavior Specification:
const CompanyRegistrationForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyCity: '',
    companyProvince: '',
    companyType: 'distributor',
    licenseNumber: '',
    taxId: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Real-time validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'companyEmail':
      case 'adminEmail':
        const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/i;
        return emailRegex.test(value) ? null : 'Email must be @gmail.com or @outlook.com';
      
      case 'password':
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(value) ? null : 'Min 8 chars, 1 uppercase, 1 number';
      
      case 'confirmPassword':
        return value === formData.password ? null : 'Passwords do not match';
      
      case 'licenseNumber':
        const licenseRegex = /^[A-Z]{3}-\d{5}-\d{4}$/;
        return licenseRegex.test(value) ? null : 'Format: PHA-12345-2024';
      
      default:
        return value.trim() ? null : `${name} is required`;
    }
  };

  // Handle input changes with real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation for email fields
    if (name.includes('Email')) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Single Step: Company Registration (No OTP)
  const handleRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation during loading state
    const validationErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'confirmPassword') {
        const error = validateField(key, formData[key]);
        if (error) validationErrors[key] = error;
      }
    });

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Please fix the validation errors'
      });
      return;
    }

    try {
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Success - company registered immediately
        showModalDialog({
          type: 'success',
          icon: '🎉',
          message: 'Company registered successfully! You can now login.',
          autoClose: 3000
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const errorData = await response.json();
        showModalDialog({
          type: 'error',
          icon: '❌',
          message: errorData.message || 'Registration failed'
        });
      }
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Connection error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-form">
        <div className="form-header">
          <h1>Register Your Company</h1>
          <p>Join the Pharmaceutical DMS Platform</p>
        </div>

        <form onSubmit={handleRegistration}>
          {/* Company Information */}
          <div className="form-section">
            <h3>Company Information</h3>
            
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className={errors.companyName ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.companyName && <span className="error-text">{errors.companyName}</span>}
            </div>

            <div className="form-group">
              <label>Company Email *</label>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleInputChange}
                placeholder="company@gmail.com or company@outlook.com"
                className={errors.companyEmail ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.companyEmail && <span className="error-text">{errors.companyEmail}</span>}
            </div>

            <div className="form-group">
              <label>Company Phone *</label>
              <input
                type="tel"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleInputChange}
                placeholder="+1234567890"
                className={errors.companyPhone ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.companyPhone && <span className="error-text">{errors.companyPhone}</span>}
            </div>

            <div className="form-group">
              <label>License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                placeholder="PHA-12345-2024"
                className={errors.licenseNumber ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.licenseNumber && <span className="error-text">{errors.licenseNumber}</span>}
            </div>
          </div>

          {/* Admin User Information */}
          <div className="form-section">
            <h3>Administrator Account</h3>
            
            <div className="form-group">
              <label>Admin Name *</label>
              <input
                type="text"
                name="adminName"
                value={formData.adminName}
                onChange={handleInputChange}
                placeholder="Enter admin full name"
                className={errors.adminName ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.adminName && <span className="error-text">{errors.adminName}</span>}
            </div>

            <div className="form-group">
              <label>Admin Email *</label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleInputChange}
                placeholder="admin@gmail.com or admin@outlook.com"
                className={errors.adminEmail ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.adminEmail && <span className="error-text">{errors.adminEmail}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="register-button"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              'Register Company'
            )}
          </button>
        </form>

        <div className="login-link">
          Already have an account? 
          <a href="/login">Login Here</a>
        </div>
      </div>
    </div>
  );
};
```
              
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="ABC Pharmaceuticals Ltd."
                  disabled={isLoading}
                  className={errors.companyName ? 'error' : ''}
                />
                {errors.companyName && <span className="error-text">{errors.companyName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company Email *</label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value.toLowerCase())}
                    placeholder="company@gmail.com"
                    disabled={isLoading}
                    className={errors.companyEmail ? 'error' : ''}
                  />
                  {errors.companyEmail && <span className="error-text">{errors.companyEmail}</span>}
                </div>

                <div className="form-group">
                  <label>Company Phone *</label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    placeholder="+1234567890"
                    disabled={isLoading}
                    className={errors.companyPhone ? 'error' : ''}
                  />
                  {errors.companyPhone && <span className="error-text">{errors.companyPhone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value.toUpperCase())}
                  placeholder="PHA-12345-2024"
                  disabled={isLoading}
                  className={errors.licenseNumber ? 'error' : ''}
                />
                {errors.licenseNumber && <span className="error-text">{errors.licenseNumber}</span>}
              </div>
            </div>

            {/* Admin User Information */}
            <div className="form-section">
              <h3>Administrator Account</h3>
              
              <div className="form-group">
                <label>Admin Name *</label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  placeholder="John Smith"
                  disabled={isLoading}
                  className={errors.adminName ? 'error' : ''}
                />
                {errors.adminName && <span className="error-text">{errors.adminName}</span>}
              </div>

              <div className="form-group">
                <label>Admin Email *</label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value.toLowerCase())}
                  placeholder="admin@gmail.com"
                  disabled={isLoading}
                  className={errors.adminEmail ? 'error' : ''}
                />
                {errors.adminEmail && <span className="error-text">{errors.adminEmail}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    disabled={isLoading}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="register-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                'Register Company'
              )}
            </button>
          </form>

          <div className="login-link">
            Already have an account? 
            <a href="/login">Login Here</a>
          </div>
        </div>
      ) : (
        // Step 2: OTP Verification
        <div className="verification-form">
          <div className="form-header">
            <h1>Verify Your Email</h1>
            <p>Enter the 6-digit code sent to {formData.companyEmail}</p>
          </div>

          <form onSubmit={handleOtpVerification}>
            <div className="otp-input-container">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="otp-input"
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <div className="otp-timer">
              {otpTimeLeft > 0 ? (
                <p>Code expires in: {Math.floor(otpTimeLeft/60)}:{(otpTimeLeft%60).toString().padStart(2, '0')}</p>
              ) : (
                <p className="expired">Code has expired</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading || otp.length !== 6}
              className="verify-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify Company'
              )}
            </button>

            <button 
              type="button"
              onClick={handleResendOtp}
              className="resend-button"
              disabled={otpTimeLeft > 540} // Disable for first 60 seconds
            >
              Resend Code
            </button>
          </form>

          <div className="back-link">
            <a onClick={() => setStep(1)}>← Back to Registration</a>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🔑 **Password Reset Module**

### **3. ForgotPasswordForm Component** ✅ **DEFINED**
```javascript
// Component Behavior Specification:
const ForgotPasswordForm = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpTimeLeft, setOtpTimeLeft] = useState(600);

  // Step 1: Send Reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/i;
    if (!emailRegex.test(email)) {
      setErrors({ email: 'Email must be @gmail.com or @outlook.com' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/notifications/password-reset/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      if (response.ok) {
        setStep(2);
        setOtpTimeLeft(600);
        startOtpTimer();
        showModalDialog({
          type: 'success',
          icon: '📧',
          message: 'Reset code sent to your email!'
        });
      } else {
        const errorData = await response.json();
        showModalDialog({
          type: 'error',
          icon: '❌',
          message: errorData.message || 'Email not found'
        });
      }
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Failed to send reset code'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 & 3: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrors({ password: 'Min 8 chars, 1 uppercase, 1 number' });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/notifications/password-reset/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otp,
          newPassword
        })
      });

      if (response.ok) {
        showModalDialog({
          type: 'success',
          icon: '🎉',
          message: 'Password reset successfully! You can now login.',
          autoClose: 3000
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const errorData = await response.json();
        showModalDialog({
          type: 'error',
          icon: '❌',
          message: errorData.message || 'Invalid reset code'
        });
      }
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Password reset failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startOtpTimer = () => {
    const timer = setInterval(() => {
      setOtpTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="forgot-password-container">
      {step === 1 && (
        // Step 1: Email Input
        <div className="reset-form">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset code</p>
          
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="your-email@gmail.com"
                disabled={isLoading}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        // Step 2: OTP Input and New Password
        <div className="reset-form">
          <h1>Enter Reset Code</h1>
          <p>Enter the code sent to {email}</p>
          
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Reset Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                disabled={isLoading}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={isLoading}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <div className="otp-timer">
              Code expires in: {Math.floor(otpTimeLeft/60)}:{(otpTimeLeft%60).toString().padStart(2, '0')}
            </div>

            <button type="submit" disabled={isLoading || otp.length !== 6}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}

      <div className="back-to-login">
        <a href="/login">← Back to Login</a>
      </div>
    </div>
  );
};
```

## 🎯 **Core Application Components**

### **4. Dashboard Component** 🚀 **NEXT TO IMPLEMENT**

**Purpose**: Main landing page after login showing company overview, quick stats, recent activities, and navigation.

**API Endpoints Used**:
```javascript
// Dashboard Statistics
GET /api/company/profile                    // Company info display
GET /api/inventory/count                    // Total inventory items
GET /api/invoices/stats                     // Invoice statistics 
GET /api/ledger/summary                     // Financial summary
GET /api/delivery-assignments/pending      // Pending deliveries
GET /api/notifications/unread-count        // Notification badges
```

**Props & State Management**:
```javascript
// Dashboard State
const [dashboardData, setDashboardData] = useState({
  companyInfo: null,
  stats: {
    totalInventory: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
    unreadNotifications: 0
  },
  recentActivity: [],
  isLoading: true
});

// Company context (from login)
const { user, company } = useAuth();
```

**Component Structure**:
```jsx
const Dashboard = () => {
  const { user, company } = useAuth();
  const [dashboardData, setDashboardData] = useState({...});
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Parallel API calls for dashboard data
      const [companyRes, inventoryRes, invoiceRes, ledgerRes, deliveryRes, notificationRes] = 
        await Promise.all([
          fetch('/api/company/profile'),
          fetch('/api/inventory/count'),
          fetch('/api/invoices/stats'),
          fetch('/api/ledger/summary'),
          fetch('/api/delivery-assignments/pending'),
          fetch('/api/notifications/unread-count')
        ]);
      
      setDashboardData({
        companyInfo: await companyRes.json(),
        stats: {
          totalInventory: (await inventoryRes.json()).count,
          totalInvoices: (await invoiceRes.json()).total,
          totalRevenue: (await ledgerRes.json()).totalRevenue,
          pendingDeliveries: (await deliveryRes.json()).count,
          unreadNotifications: (await notificationRes.json()).count
        },
        isLoading: false
      });
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="dashboard">
      {/* Header with company info and user profile */}
      <header className="dashboard-header">
        <div className="company-info">
          <h1>Welcome, {company?.name}</h1>
          <p>License: {company?.licenseNumber}</p>
        </div>
        <div className="user-actions">
          <NotificationBell count={dashboardData.stats.unreadNotifications} />
          <UserProfile user={user} />
        </div>
      </header>

      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <StatsCard 
          title="Total Inventory" 
          value={dashboardData.stats.totalInventory}
          icon="📦"
          link="/inventory"
        />
        <StatsCard 
          title="Total Invoices" 
          value={dashboardData.stats.totalInvoices}
          icon="📄"
          link="/invoices"
        />
        <StatsCard 
          title="Total Revenue" 
          value={`PKR ${dashboardData.stats.totalRevenue?.toLocaleString()}`}
          icon="💰"
          link="/ledger"
        />
        <StatsCard 
          title="Pending Deliveries" 
          value={dashboardData.stats.pendingDeliveries}
          icon="🚚"
          link="/deliveries"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="main-navigation">
        <NavCard title="Inventory Management" icon="📦" link="/inventory" />
        <NavCard title="Invoice Management" icon="📄" link="/invoices" />
        <NavCard title="Customer Management" icon="👥" link="/customers" />
        <NavCard title="Financial Ledger" icon="💰" link="/ledger" />
        <NavCard title="Delivery Management" icon="🚚" link="/deliveries" />
        <NavCard title="User Management" icon="👤" link="/users" />
        <NavCard title="Settings" icon="⚙️" link="/settings" />
      </nav>

      {/* Recent Activity Feed */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <ActivityFeed activities={dashboardData.recentActivity} />
      </div>
    </div>
  );
};
```

**UI/UX Requirements**:
- **Responsive Grid Layout**: 4-column stats grid on desktop, 2-column on tablet, 1-column on mobile
- **Real-time Updates**: Stats should refresh every 30 seconds or on user action
- **Loading States**: Skeleton cards while data loads
- **Error Handling**: Graceful degradation if API calls fail
- **Navigation Accessibility**: Clear focus states and keyboard navigation

**CSS Classes Expected**:
```css
.dashboard { /* Main container */ }
.dashboard-header { /* Top section with company info */ }
.company-info h1 { /* Company name styling */ }
.user-actions { /* Profile and notifications */ }
.stats-grid { /* 4-column responsive grid */ }
.main-navigation { /* Navigation cards grid */ }
.recent-activity { /* Activity feed section */ }
```

---

### **5. Inventory Management Module** 🚀 **NEXT TO IMPLEMENT**

**Purpose**: Complete inventory management with add/edit/delete products, stock tracking, and batch management.

**API Endpoints Used**:
```javascript
// Inventory CRUD
GET    /api/inventory/list?page=1&limit=10&search=medicine    // Paginated list
POST   /api/inventory/add                                      // Add new item
GET    /api/inventory/:id                                      // Get single item
PUT    /api/inventory/:id                                      // Update item
DELETE /api/inventory/:id                                      // Delete item
GET    /api/inventory/search?q=paracetamol                    // Search products
GET    /api/inventory/low-stock                               // Low stock alerts
POST   /api/inventory/:id/adjust                                // Stock adjustment

// Supporting data
GET    /api/brands/list                                        // Available brands
GET    /api/products/list                                      // Product catalog
```

**Component Structure**:
```jsx
const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    lowStock: false
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Main inventory list component
  return (
    <div className="inventory-management">
      <InventoryHeader 
        onAddNew={() => setShowAddModal(true)}
        onSearch={(search) => setFilters({...filters, search})}
        onFilterChange={setFilters}
      />
      
      <InventoryTable 
        items={inventory}
        onEdit={(item) => {
          setSelectedItem(item);
          setShowEditModal(true);
        }}
        onDelete={handleDelete}
        onStockAdjust={handleStockAdjust}
      />
      
      <Pagination 
        {...pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {showAddModal && (
        <AddInventoryModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshInventory}
        />
      )}
      
      {showEditModal && (
        <EditInventoryModal 
          item={selectedItem}
          onClose={() => setShowEditModal(false)}
          onSuccess={refreshInventory}
        />
      )}
    </div>
  );
};
```

**Sub-Components Required**:

**5.1 InventoryHeader Component**:
```javascript
const InventoryHeader = ({ onAddNew, onSearch, onFilterChange }) => (
  <div className="inventory-header">
    <h2>Inventory Management</h2>
    <div className="header-actions">
      <SearchBox onSearch={onSearch} placeholder="Search medicines..." />
      <FilterDropdown 
        options={['All Brands', 'Low Stock', 'Expired Soon']}
        onFilter={onFilterChange}
      />
      <button className="btn-primary" onClick={onAddNew}>
        + Add New Item
      </button>
    </div>
  </div>
);
```

**5.2 InventoryTable Component**:
```javascript
const InventoryTable = ({ items, onEdit, onDelete, onStockAdjust }) => (
  <div className="inventory-table">
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Brand</th>
          <th>Current Stock</th>
          <th>Unit Price</th>
          <th>Expiry Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <InventoryRow 
            key={item._id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onStockAdjust={onStockAdjust}
          />
        ))}
      </tbody>
    </table>
  </div>
);
```

**5.3 AddInventoryModal Component**:
```javascript
const AddInventoryModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    productName: '',
    brandId: '',
    currentStock: '',
    unitPrice: '',
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
    description: ''
  });
  const [brands, setBrands] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Failed to add inventory item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Add New Inventory Item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="inventory-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Product Name *"
            value={formData.productName}
            onChange={(e) => setFormData({...formData, productName: e.target.value})}
            required
          />
          <select
            value={formData.brandId}
            onChange={(e) => setFormData({...formData, brandId: e.target.value})}
            required
          >
            <option value="">Select Brand *</option>
            {brands.map(brand => (
              <option key={brand._id} value={brand._id}>{brand.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-row">
          <input
            type="number"
            placeholder="Current Stock *"
            value={formData.currentStock}
            onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Unit Price (PKR) *"
            value={formData.unitPrice}
            onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
            required
          />
        </div>
        
        <div className="form-row">
          <input
            type="date"
            placeholder="Expiry Date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
          />
          <input
            type="text"
            placeholder="Batch Number"
            value={formData.batchNumber}
            onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
          />
        </div>
        
        <input
          type="text"
          placeholder="Manufacturer"
          value={formData.manufacturer}
          onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
        />
        
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="3"
        />
        
        <div className="form-actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Adding...
              </>
            ) : (
              'Add Item'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

**Validation Rules**:
- **Product Name**: Required, 2-100 characters
- **Brand**: Required, must exist in brands collection
- **Current Stock**: Required, positive integer
- **Unit Price**: Required, positive decimal (PKR)
- **Expiry Date**: Optional, future date recommended
- **Batch Number**: Optional, alphanumeric

**UI/UX Features**:
- **Sortable Columns**: Click headers to sort by name, stock, price, expiry
- **Bulk Actions**: Select multiple items for bulk delete/edit
- **Stock Status Indicators**: Color-coded (Green: In Stock, Yellow: Low Stock, Red: Out of Stock)
- **Expiry Alerts**: Visual warning for items expiring within 30 days
- **Export Functionality**: Export inventory to Excel/PDF
- **Barcode Support**: Scan barcodes to quickly add items

---


### **6. Invoice Management Module – Frontend Specification (Revised)**

#### **UI Layout & Features**
- **Add Invoice Button:** Top right of the invoice management page.
- **Filters Row:** All relevant filters (date, customer, invoice number, payment type, etc.), but **no active/inactive filter**.
- **Invoice List Table:**
  - Shows: invoice number, customer, medicines (scrollable string, fixed row height), total bill, cash, credit, etc.
  - Edit, Print (PDF, A4), and Delete (soft delete) options per row.
  - Bulk delete (soft delete) with multi-select.
  - All standard table features: sorting, searching, pagination, export (PDF/Excel), responsive design.

#### **Add/Edit Invoice Flow**
- **Opens a new page** (not modal) for add/edit.
- **Header Section:** All header fields from backend (auto-filled fields are auto-filled).
- **Body Section:**
  - Input fields for all backend body fields.
  - First input auto-focused.
  - Add sub-record by pressing Enter or clicking Add.
  - Fields clear after adding; cannot add if validation fails.
  - Each sub-record in the list has Edit/Delete.
  - On Edit: Data loads into input fields for update.
  - **When a medicine is selected:**
    - Show total stock for that medicine (from inventory).
    - Show last three prices for this medicine to this customer (display near the medicine input or as a tooltip/dropdown).
  - **Batch selection:** FEFO (First Expiry First Out) is default and automatic, but user can override batch selection if needed.
- **Footer Section:** All backend footer fields.
- **Save/Cancel:** Save posts the full invoice to backend.

#### **Backend/Frontend Logic**
- **All fields and calculations are as per backend.** (Discounts, totals, etc. are calculated in backend; frontend only displays/calculates for UI feedback.)
- **No taxes.**
- **Payments:** Cash and credit only, as per backend.
- **No status/workflow.**
- **Notifications:** Overdue invoice notifications are handled by backend/notification module.
- **Export/Print:** PDF (A4) format.

#### **Other Notes**
- **Batch selection is automated (FEFO), but user can override.**
- **Show last three prices for each medicine/customer in the add/edit invoice UI.**
- **All fields in the backend must be present in the frontend forms.**
- **Soft delete for invoices and bulk delete.**
- **No external integrations.**

  const addItem = () => {
    const product = availableProducts.find(p => p._id === selectedProduct);
    if (!product) return;

    const newItem = {
      productId: product._id,
      productName: product.productName,
      quantity: 1,
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice
    };

    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    calculateTotals([...invoiceData.items, newItem]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = 
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setInvoiceData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    const totalAmount = subtotal + taxAmount - invoiceData.discount;
    
    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  return (
    <Modal title="Create New Invoice" onClose={onClose} size="large">
      <form onSubmit={handleSubmit} className="invoice-form">
        {/* Customer Selection */}
        <div className="form-section">
          <h4>Customer Information</h4>
          <select
            value={invoiceData.customerId}
            onChange={(e) => setInvoiceData({...invoiceData, customerId: e.target.value})}
            required
          >
            <option value="">Select Customer *</option>
            {customers.map(customer => (
              <option key={customer._id} value={customer._id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Items Section */}
        <div className="form-section">
          <h4>Invoice Items</h4>
          
          {/* Add Item Row */}
          <div className="add-item-row">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Select Product</option>
              {availableProducts.map(product => (
                <option key={product._id} value={product._id}>
                  {product.productName} - PKR {product.unitPrice}
                </option>
              ))}
            </select>
            <button type="button" onClick={addItem} disabled={!selectedProduct}>
              Add Item
            </button>
          </div>

          {/* Items Table */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                    />
                  </td>
                  <td>PKR {item.totalPrice.toFixed(2)}</td>
                  <td>
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="btn-danger-small"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="form-section totals-section">
          <div className="totals-grid">
            <div className="total-row">
              <label>Subtotal:</label>
              <span>PKR {invoiceData.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="total-row">
              <label>Tax Rate (%):</label>
              <input
                type="number"
                step="0.01"
                value={invoiceData.taxRate}
                onChange={(e) => {
                  const taxRate = parseFloat(e.target.value) || 0;
                  setInvoiceData(prev => ({ ...prev, taxRate }));
                  calculateTotals(invoiceData.items);
                }}
              />
            </div>
            
            <div className="total-row">
              <label>Tax Amount:</label>
              <span>PKR {invoiceData.taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="total-row">
              <label>Discount:</label>
              <input
                type="number"
                step="0.01"
                value={invoiceData.discount}
                onChange={(e) => {
                  const discount = parseFloat(e.target.value) || 0;
                  setInvoiceData(prev => ({ ...prev, discount }));
                  calculateTotals(invoiceData.items);
                }}
              />
            </div>
            
            <div className="total-row final-total">
              <label>Total Amount:</label>
              <span>PKR {invoiceData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="form-section">
          <div className="form-row">
            <input
              type="date"
              placeholder="Due Date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
            />
          </div>
          
          <textarea
            placeholder="Notes (optional)"
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

**Invoice Calculation Logic**:
```javascript
// Automatic calculations
const calculateInvoiceTotals = (items, taxRate, discount) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
  
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount - discount;
  
  return { subtotal, taxAmount, totalAmount };
};
```

**Validation Rules**:
- **Customer**: Required, must exist in database
- **Items**: At least one item required
- **Quantity**: Positive integer, cannot exceed available stock
- **Unit Price**: Positive decimal
- **Tax Rate**: 0-100%
- **Discount**: Cannot exceed subtotal + tax

---

### **7. Customer Management Module** 🚀 **NEXT TO IMPLEMENT**

**Purpose**: Manage customer information, view order history, and track communication.

**API Endpoints Used**:
```javascript
// Customer CRUD
GET    /api/customers/list?page=1&limit=10    // Paginated customer list
POST   /api/customers/add                      // Add new customer
GET    /api/customers/:id                      // Get customer details
PUT    /api/customers/:id                      // Update customer
DELETE /api/customers/:id                      // Delete customer

// Order History
GET    /api/orders/customer/:id                // Get orders for customer
GET    /api/orders/stats/customer/:id          // Get order statistics for customer
```

**Component Structure**:
```jsx
const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="customer-management">
      <CustomerHeader 
        onAddNew={() => setShowAddModal(true)}
      />
      
      <CustomerTable 
        customers={customers}
        onEdit={(customer) => {
          setSelectedCustomer(customer);
          setShowEditModal(true);
        }}
        onDelete={handleDelete}
      />

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshCustomers}
        />
      )}
      
      {showEditModal && (
        <EditCustomerModal 
          customer={selectedCustomer}
          onClose={() => setShowEditModal(false)}
          onSuccess={refreshCustomers}
        />
      )}
    </div>
  );
};
```

**7.1 CustomerHeader Component**:
```javascript
const CustomerHeader = ({ onAddNew }) => (
  <div className="customer-header">
    <h2>Customer Management</h2>
    <div className="header-actions">
      <button className="btn-primary" onClick={onAddNew}>
        + Add New Customer
      </button>
    </div>
  </div>
);
```

**7.2 CustomerTable Component**:
```javascript
const CustomerTable = ({ customers, onEdit, onDelete, onViewOrders }) => (
  <div className="customer-table">
    <table>
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>City</th>
          <th>Total Orders</th>
          <th>Total Spent</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {customers.map(customer => (
          <CustomerRow 
            key={customer._id}
            customer={customer}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewOrders={onViewOrders}
          />
        ))}
      </tbody>
    </table>
  </div>
);
```

**7.3 AddCustomerModal Component**:
```javascript
const AddCustomerModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
          customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerProvince: '',
    pharmacyLicense: '',
    taxId: '',
    creditLimit: 0,
    paymentTerms: '30',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Valid email is required';
    }
    
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/customers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showModalDialog({
          type: 'success',
          icon: '✅',
          message: 'Customer added successfully!'
        });
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        showModalDialog({
          type: 'error',
          icon: '❌',
          message: error.message || 'Failed to add customer'
        });
      }
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Connection error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Add New Customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="customer-form">
        <div className="form-row">
          <div className="form-group">
            <label>Customer Name *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              placeholder="Customer/Pharmacy Name"
              className={errors.customerName ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.customerName && <span className="error-text">{errors.customerName}</span>}
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({...formData, customerEmail: e.target.value.toLowerCase()})}
              placeholder="customer@pharmacy.com"
              className={errors.customerEmail ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.customerEmail && <span className="error-text">{errors.customerEmail}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              placeholder="+92-300-1234567"
              className={errors.customerPhone ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.customerPhone && <span className="error-text">{errors.customerPhone}</span>}
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={formData.customerCity}
              onChange={(e) => setFormData({...formData, customerCity: e.target.value})}
              placeholder="Lahore"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Complete Address</label>
          <textarea
            value={formData.customerAddress}
            onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
            placeholder="Full customer address"
            rows="3"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Credit Limit (PKR)</label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})}
              placeholder="0"
              min="0"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Payment Terms (Days)</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
              disabled={isSubmitting}
            >
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
              <option value="45">45 Days</option>
              <option value="60">60 Days</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional notes about customer"
            rows="2"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Adding...
              </>
            ) : (
              'Add Customer'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

**Customer Validation Rules**:
- **Customer Name**: Required, 2-100 characters
- **Email**: Required, valid email format
- **Phone**: Required, valid phone format (10-15 digits)
- **Address**: Optional but recommended
- **Credit Limit**: Non-negative number
- **Payment Terms**: Standard options (15, 30, 45, 60 days)

**UI/UX Features**:
- **Customer Search**: Search by name, email, or phone
- **Order History View**: Click customer to see all orders
- **Credit Management**: Track outstanding balances
- **Communication Log**: Track calls and emails
- **Export Customer List**: Export to Excel/PDF

---

### **8. User Management Module** 🚀 **NEXT TO IMPLEMENT**

**Purpose**: Admin-only module to manage company users, roles, and permissions.

**API Endpoints Used**:
```javascript
// User Management (Admin Only)
GET    /api/users/list                         // Get all company users
POST   /api/users/register                     // Add new user (admin only)
GET    /api/users/:id                          // Get user details
PUT    /api/users/:id                          // Update user
DELETE /api/users/:id                          // Delete user
PUT    /api/users/:id/role                     // Update user role
PUT    /api/users/:id/status                   // Activate/deactivate user
```

**Component Structure**:
```jsx
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user: currentUser } = useAuth();

  // Only admin can access this module
  if (currentUser.role !== 'admin') {
    return <AccessDenied message="Admin access required" />;
  }

  return (
    <div className="user-management">
      <UserHeader 
        onAddNew={() => setShowAddModal(true)}
        totalUsers={users.length}
      />
      
      <UserTable 
        users={users}
        currentUser={currentUser}
        onEdit={(user) => {
          setSelectedUser(user);
          setShowEditModal(true);
        }}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modals */}
      {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshUsers}
        />
      )}
      
      {showEditModal && (
        <EditUserModal 
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={refreshUsers}
        />
      )}
    </div>
  );
};
```

**8.1 AddUserModal Component**:
```javascript
const AddUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    department: '',
    permissions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const availablePermissions = [
    { id: 'inventory_read', label: 'View Inventory' },
    { id: 'inventory_write', label: 'Manage Inventory' },
    { id: 'invoice_read', label: 'View Invoices' },
    { id: 'invoice_write', label: 'Manage Invoices' },
    { id: 'customer_read', label: 'View Customers' },
    { id: 'customer_write', label: 'Manage Customers' },
    { id: 'reports_read', label: 'View Reports' },
    { id: 'settings_write', label: 'Manage Settings' }
  ];

  const handlePermissionChange = (permissionId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionId)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com)$/i;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email must be @gmail.com or @outlook.com';
    }
    
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Min 8 chars, 1 uppercase, 1 number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showModalDialog({
          type: 'success',
          icon: '✅',
          message: 'User added successfully!'
        });
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        showModalDialog({
          type: 'error',
          icon: '❌',
          message: error.message || 'Failed to add user'
        });
      }
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Connection error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Add New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="User's full name"
              className={errors.name ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
              placeholder="user@gmail.com"
              className={errors.email ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+92-300-1234567"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              disabled={isSubmitting}
            >
              <option value="user">Regular User</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className={errors.password ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Confirm password"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            placeholder="Sales, Inventory, Finance, etc."
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>Permissions</label>
          <div className="permissions-grid">
            {availablePermissions.map(permission => (
              <label key={permission.id} className="permission-checkbox">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission.id)}
                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                  disabled={isSubmitting}
                />
                {permission.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Adding User...
              </>
            ) : (
              'Add User'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

**User Roles & Permissions**:
- **Admin**: Full system access, user management
- **Manager**: Can manage inventory, invoices, customers
- **User**: Read-only access or specific module permissions

---

### **9. Financial Ledger Module** 🚀 **NEXT TO IMPLEMENT**

**Purpose**: Track all financial transactions, accounts receivable/payable, and generate financial reports.

**API Endpoints Used**:
```javascript
// Ledger Management
GET    /api/ledger/entries?page=1&type=all     // Get ledger entries
POST   /api/ledger/entry                       // Create ledger entry
GET    /api/ledger/receivables                 // Accounts receivable
GET    /api/ledger/payables                    // Accounts payable
GET    /api/ledger/balance-sheet              // Balance sheet data
GET    /api/ledger/profit-loss                // P&L statement
GET    /api/ledger/cash-flow                  // Cash flow statement
```

**Component Structure**:
```jsx
const LedgerManagement = () => {
  const [activeTab, setActiveTab] = useState('entries');
  const [ledgerData, setLedgerData] = useState({
    entries: [],
    receivables: [],
    payables: [],
    summary: {}
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  return (
    <div className="ledger-management">
      <LedgerHeader 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
      />
      
      <LedgerTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'entries' && (
        <LedgerEntries 
          entries={ledgerData.entries}
          onAddEntry={handleAddEntry}
        />
      )}
      
      {activeTab === 'receivables' && (
        <AccountsReceivable 
          receivables={ledgerData.receivables}
        />
      )}
      
      {activeTab === 'payables' && (
        <AccountsPayable 
          payables={ledgerData.payables}
        />
      )}
      
      {activeTab === 'reports' && (
        <FinancialReports 
          dateRange={dateRange}
        />
      )}
    </div>
  );
};
```

**9.1 LedgerEntries Component**:
```jsx
const LedgerEntries = ({ entries, onAddEntry }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="ledger-entries">
      <div className="entries-header">
        <h3>Ledger Entries</h3>
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add Entry
        </button>
      </div>

      <div className="entries-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry._id}>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td>{entry.description}</td>
                <td>{entry.account}</td>
                <td className="debit">{entry.debit ? `PKR ${entry.debit.toLocaleString()}` : '-'}</td>
                <td className="credit">{entry.credit ? `PKR ${entry.credit.toLocaleString()}` : '-'}</td>
                <td className={entry.balance >= 0 ? 'positive' : 'negative'}>
                  PKR {Math.abs(entry.balance).toLocaleString()}
                </td>
                <td>{entry.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddLedgerEntryModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={onAddEntry}
        />
      )}
    </div>
  );
};
```

**9.2 FinancialReports Component**:
```jsx
const FinancialReports = ({ dateRange }) => {
  const [reportType, setReportType] = useState('profit-loss');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async (type) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ledger/${type}?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      showModalDialog({
        type: 'error',
        icon: '❌',
        message: 'Failed to generate report'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateReport(reportType);
  }, [reportType, dateRange]);

  return (
    <div className="financial-reports">
      <div className="report-controls">
        <select 
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="profit-loss">Profit & Loss Statement</option>
          <option value="balance-sheet">Balance Sheet</option>
          <option value="cash-flow">Cash Flow Statement</option>
        </select>
        
        <button 
          className="btn-secondary"
          onClick={() => generateReport(reportType)}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Refresh Report'}
        </button>
        
        <button 
          className="btn-primary"
          onClick={() => window.print()}
        >
          Print Report
        </button>
      </div>

      {isLoading ? (
        <div className="loading-report">Generating report...</div>
      ) : (
        <div className="report-content">
          {reportType === 'profit-loss' && (
            <ProfitLossReport data={reportData} />
          )}
          {reportType === 'balance-sheet' && (
            <BalanceSheetReport data={reportData} />
          )}
          {reportType === 'cash-flow' && (
            <CashFlowReport data={reportData} />
          )}
        </div>
      )}
    </div>
  );
};
```

**Financial Features**:
- **Double-Entry Bookkeeping**: Every transaction has debit and credit entries
- **Real-time Balance Calculation**: Running balance for each account
- **Financial Reports**: P&L, Balance Sheet, Cash Flow statements
- **Date Range Filtering**: Flexible date-based reporting
- **Export Functionality**: Export reports to PDF/Excel

---

### **10. Settings Management Module** 🚀 **NEXT TO IMPLEMENT**

**Purpose**: Configure system settings, company preferences, and backup options.

**API Endpoints Used**:
```javascript
// Settings Management
GET    /api/settings/company                   // Get company settings
PUT    /api/settings/company                   // Update company settings
GET    /api/settings/system                    // Get system settings
PUT    /api/settings/system                    // Update system settings
GET    /api/settings/backup                    // Get backup settings
PUT    /api/settings/backup                    // Update backup settings
POST   /api/settings/backup/create             // Create manual backup
```

**Component Structure**:
```jsx
const SettingsManagement = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState({
    company: {},
    system: {},
    backup: {}
  });
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="settings-management">
      <SettingsHeader 
        hasChanges={hasChanges}
        onSave={handleSaveSettings}
        onReset={handleResetSettings}
      />
      
      <SettingsTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'company' && (
        <CompanySettings 
          settings={settings.company}
          onChange={handleCompanySettingsChange}
        />
      )}
      
      {activeTab === 'system' && (
        <SystemSettings 
          settings={settings.system}
          onChange={handleSystemSettingsChange}
        />
      )}
      
      {activeTab === 'backup' && (
        <BackupSettings 
          settings={settings.backup}
          onChange={handleBackupSettingsChange}
        />
      )}
      
      {activeTab === 'users' && (
        <UserSettings />
      )}
    </div>
  );
};
```

**10.1 CompanySettings Component**:
```javascript
const CompanySettings = ({ settings, onChange }) => {
  return (
    <div className="company-settings">
      <div className="settings-section">
        <h3>Company Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={settings.companyName || ''}
              onChange={(e) => onChange('companyName', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>License Number</label>
            <input
              type="text"
              value={settings.licenseNumber || ''}
              onChange={(e) => onChange('licenseNumber', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Company Address</label>
          <textarea
            value={settings.companyAddress || ''}
            onChange={(e) => onChange('companyAddress', e.target.value)}
            rows="3"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Financial Settings</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Default Currency</label>
            <select
              value={settings.currency || 'PKR'}
              onChange={(e) => onChange('currency', e.target.value)}
            >
              <option value="PKR">Pakistani Rupee (PKR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Default Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.taxRate || 0}
              onChange={(e) => {
                const taxRate = parseFloat(e.target.value) || 0;
                setInvoiceData(prev => ({ ...prev, taxRate }));
                calculateTotals(invoiceData.items);
              }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Invoice Prefix</label>
            <input
              type="text"
              value={settings.invoicePrefix || 'INV'}
              onChange={(e) => onChange('invoicePrefix', e.target.value)}
              placeholder="INV"
            />
          </div>
          
          <div className="form-group">
            <label>Payment Terms (Days)</label>
            <select
              value={settings.paymentTerms || '30'}
              onChange={(e) => onChange('paymentTerms', e.target.value)}
            >
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
              <option value="45">45 Days</option>
              <option value="60">60 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notification Preferences</h3>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.emailNotifications || false}
              onChange={(e) => onChange('emailNotifications', e.target.checked)}
            />
            Email Notifications
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.lowStockAlerts || true}
              onChange={(e) => onChange('lowStockAlerts', e.target.checked)}
            />
            Low Stock Alerts
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.expiryAlerts || true}
              onChange={(e) => onChange('expiryAlerts', e.target.checked)}
            />
            Product Expiry Alerts
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.paymentReminders || true}
              onChange={(e) => onChange('paymentReminders', e.target.checked)}
            />
            Payment Reminders
          </label>
        </div>
      </div>
    </div>
  );
};
```

### **🏙️ Area & Sub-Area Management Module 🚀 NEXT TO IMPLEMENT**

**Purpose**: Organize geographic areas and sub-areas for delivery, customer, and employee assignment. Supports CRUD, bulk actions, filtering, export, and strict user/company data isolation.

**API Endpoints Used**:
```javascript
// Areas CRUD
GET    /api/areas/list?page=1&limit=10&search=lahore         // Paginated list
POST   /api/areas/add                                        // Add new area
GET    /api/areas/:id                                        // Get area details
PUT    /api/areas/:id                                        // Update area
DELETE /api/areas/:id                                        // Delete area

// Sub-Areas CRUD
GET    /api/sub-areas/list?areaId=...&search=model town      // List sub-areas for an area
POST   /api/sub-areas/add                                   // Add new sub-area
GET    /api/sub-areas/:id                                   // Get sub-area details
PUT    /api/sub-areas/:id                                   // Update sub-area
DELETE /api/sub-areas/:id                                   // Delete sub-area

// Bulk Actions
POST   /api/areas/bulk-delete                                // Bulk delete areas
POST   /api/sub-areas/bulk-delete                            // Bulk delete sub-areas

// Export
GET    /api/areas/export?format=excel                        // Export areas to Excel/CSV
GET    /api/sub-areas/export?format=excel                    // Export sub-areas to Excel/CSV
```

**Component Structure**:
```jsx
const AreaManagement = () => {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [subAreas, setSubAreas] = useState([]);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showEditAreaModal, setShowEditAreaModal] = useState(false);
  const [showAddSubAreaModal, setShowAddSubAreaModal] = useState(false);
  const [showEditSubAreaModal, setShowEditSubAreaModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'active', // active, inactive, both
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const { user } = useAuth(); // Only show records created by current user

  // Main area management component
  return (
    <div className="area-management">
      <AreasTable 
        areas={areas}
        onEdit={(area) => {
          setSelectedArea(area);
          setShowEditAreaModal(true);
        }}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onSelect={handleSelect}
        filters={filters}
      />

      {showAddAreaModal && (
        <AddAreaModal 
          onClose={() => setShowAddAreaModal(false)}
          onSuccess={refreshAreas}
        />
      )}
      
      {showEditAreaModal && (
        <EditAreaModal 
          area={selectedArea}
          onClose={() => setShowEditAreaModal(false)}
          onSuccess={refreshAreas}
        />
      )}
      
      {showAddSubAreaModal && (
        <AddSubAreaModal 
          onClose={() => setShowAddSubAreaModal(false)}
          onSuccess={refreshSubAreas}
        />
      )}
      
      {showEditSubAreaModal && (
        <EditSubAreaModal 
          subArea={selectedSubArea}
          onClose={() => setShowEditSubAreaModal(false)}
          onSuccess={refreshSubAreas}
        />
      )}
    </div>
  );
};
```

**Sub-Components Required**:

**1. AreasTable Component**:
```javascript
const AreasTable = ({ areas, onEdit, onDelete, onBulkDelete, onSelect, filters }) => (
  <div className="areas-table">
    <table>
      <thead>
        <tr>
          <th><input type="checkbox" onChange={onBulkSelect} /></th>
          <th>Area Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {areas.map(area => (
          <AreaRow key={area._id} area={area} onEdit={onEdit} onDelete={onDelete} onSelect={onSelect} />
        ))}
      </tbody>
    </table>
    <button onClick={onBulkDelete}>Bulk Delete</button>
    <button onClick={handleExport}>Export to Excel</button>
    <FilterDropdown options={["Active", "Inactive", "Both"]} onFilter={setFilters} />
    <SearchBox onSearch={setFilters} placeholder="Search areas..." />
  </div>
);
```

**2. SubAreasTable Component**:
```javascript
const SubAreasTable = ({ subAreas, onEdit, onDelete, onBulkDelete, onSelect, filters }) => (
  <div className="sub-areas-table">
    <table>
      <thead>
        <tr>
          <th><input type="checkbox" onChange={onBulkSelect} /></th>
          <th>Sub-Area Name</th>
          <th>Parent Area</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {subAreas.map(subArea => (
          <SubAreaRow key={subArea._id} subArea={subArea} onEdit={onEdit} onDelete={onDelete} onSelect={onSelect} />
        ))}
      </tbody>
    </table>
    <button onClick={onBulkDelete}>Bulk Delete</button>
    <button onClick={handleExport}>Export to Excel</button>
    <FilterDropdown options={["Active", "Inactive", "Both"]} onFilter={setFilters} />
    <SearchBox onSearch={setFilters} placeholder="Search sub-areas..." />
  </div>
);
```

**3. Add/Edit Modal Dialogs**:
- Use modal dialogs for add/edit actions for both areas and sub-areas.
- On add: No active/inactive toggle (default active).
- On edit: Show active/inactive toggle.
- Show modal dialog for every success, error, or failure (success auto-closes, error can be closed by user or auto-closes after timeout).

**Validation Rules**:
- No min/max restrictions on fields.
- No permissions; users only see their own records.

**Filtering & Data Isolation**:
- Filter by all fields, including status (active/inactive/both).
- Only show records created by the current user.

**Bulk Actions & Export**:
- Bulk delete supported for both areas and sub-areas.
- Export to Excel/CSV available for all modules.

**Integration**:
- Areas and sub-areas are used in delivery, customer, and employee assignment (linked selection).
- Editing a sub-area updates its parent area relationship.

**Mobile Responsiveness**:
- All components and dialogs are fully mobile responsive.

**Backend Field Naming/Conventions**:
- Use: areaName, subAreaName, isActive, createdBy, parentAreaId
- Endpoints support filtering, bulk actions, user-specific queries.

**UI/UX Features**:
- Modal dialogs for all actions
- Success/error/failure messages with icons
- Active/inactive toggle in edit modal
- Default view: active records only
- Filter for active/inactive/both
- Bulk delete and export buttons
- Mobile responsive layout

---

## 🎉 **Conclusion**

This comprehensive frontend implementation guide provides everything needed to build a complete pharmaceutical distribution management system frontend. The backend is fully functional and production-ready with multi-tenant architecture, complete API endpoints, and robust security.

**Frontend Development can now begin with confidence that:**
- ✅ All API endpoints are tested and working
- ✅ Multi-tenant data isolation is enforced  
- ✅ Authentication flows are complete with OTP verification
- ✅ User management is secure and flexible
- ✅ Inventory and invoice management are fully functional
- ✅ Customer and financial ledger modules are integrated
- ✅ Delivery and notification systems are operational
- ✅ Settings management is comprehensive

**Next Steps:**
1. Choose frontend framework (next.js recommended)
2. Set up development environment with the provided dependencies
3. Implement components following the detailed specifications
4. Test each module against the working backend API
5. Deploy to production with proper SSL and security configurations

**The result will be a complete, production-ready pharmaceutical distribution management system with modern UI/UX and robust backend infrastructure.**
```
