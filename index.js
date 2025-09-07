const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./app/routes/userRoute');
const userCustomersRoutes = require('./app/routes/userCustomersRoute');
const lookupRoutes = require('./app/routes/lookupRoute');
const brandRoutes = require('./app/routes/brandRoute');
const employeeRoutes = require('./app/routes/employeeRoute');
const areaRoutes = require('./app/routes/areaRoute');
const subAreaRoutes = require('./app/routes/subAreaRoute');
const groupRoutes = require('./app/routes/groupRoute');
const subGroupRoutes = require('./app/routes/subGroupRoute');
const productRoutes = require('./app/routes/productRoute');
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
app.use('/api/customers', userCustomersRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/subareas', subAreaRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/subgroups', subGroupRoutes);
app.use('/api/products', productRoutes);

mongoose
  .connect(
    "mongodb+srv://wsglam010:WSGlam0010@cluster1.i8pjuew.mongodb.net/DoseLogix?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    }
  )
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => console.log(error));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
