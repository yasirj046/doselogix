const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./app/routes/userRoute');
const brandRoutes = require('./app/routes/brandRoute');
const companyRoutes = require('./app/routes/companyRoute');
const superAdminRoutes = require('./app/routes/superAdminRoute');
const emailRoutes = require('./app/routes/emailRoute');
// const employeeRoutes = require('./app/routes/employeeRoute');
// const groupRoutes = require('./app/routes/groupRoute');
// const subgroupRoutes = require('./app/routes/subgroupRoute');
// const productRoutes = require('./app/routes/productRoute');
// const areaRoutes = require('./app/routes/areaRoute');
// const subAreaRoutes = require('./app/routes/subAreaRoute');
// const customerRoutes = require('./app/routes/customerRoute');
// const inventoryRoutes = require('./app/routes/inventoryRoute');
// const invoiceRoutes = require('./app/routes/invoiceRoute');
// const ledgerRoutes = require('./app/routes/ledgerRoute');
const settingsRoutes = require('./app/routes/settingsRoute');
const notificationRoutes = require('./app/routes/notificationRoute');
const schedulerRoutes = require('./app/routes/schedulerRoute');
// const deliveryAssignmentRoutes = require('./app/routes/deliveryAssignmentRoute');
const schedulerService = require('./app/services/schedulerService');
const cors = require('cors');
const morgan = require('morgan');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

// Disable ETag generation to prevent 304 responses
app.set('etag', false);

// Add global no-cache headers
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/brands', brandRoutes);
// app.use('/api/employees', employeeRoutes);
// app.use('/api/groups', groupRoutes);
// app.use('/api/subgroups', subgroupRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/areas', areaRoutes);
// app.use('/api/subareas', subAreaRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/ledger', ledgerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/scheduler', schedulerRoutes);
// app.use('/api/delivery-assignments', deliveryAssignmentRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || 'pharmaceutical_dms',
  })
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Initialize automated notification schedulers
    try {
      await schedulerService.initializeSchedulers();
    } catch (error) {
      console.error('Failed to initialize schedulers:', error.message);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
