const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
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
const purchaseEntryRoutes = require('./app/routes/purchaseEntryRoute');
const purchaseProductRoutes = require('./app/routes/purchaseProductRoute');
const salesInvoiceRoutes = require('./app/routes/salesInvoiceRoute');
const salesProductRoutes = require('./app/routes/salesProductRoute');
const inventoryRoutes = require('./app/routes/inventoryRoute');
const expenseRoutes = require('./app/routes/expenseRoute');
const ledgerRoutes = require('./app/routes/ledgerRoute');
const cors = require('cors');
const morgan = require('morgan');
const ledgerCronJob = require('./app/util/ledgerCronJob');

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
app.use('/api/purchase-entries', purchaseEntryRoutes);
app.use('/api/purchase-products', purchaseProductRoutes);
app.use('/api/sales-invoices', salesInvoiceRoutes);
app.use('/api/sales-products', salesProductRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ledger', ledgerRoutes);

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
    
    // Start ledger cron job
    ledgerCronJob.start();
  })
  .catch((error) => console.log(error));

const PORT = 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store io instance in app for use in controllers
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Handle vendor room joining
  socket.on('join_vendor_room', (vendorId) => {
    socket.join(`vendor_${vendorId}`);
    console.log(`🏠 Client ${socket.id} joined vendor room: vendor_${vendorId}`);
    
    // Send confirmation back to client
    socket.emit('room_joined', { vendorId, room: `vendor_${vendorId}` });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});

module.exports = app;
