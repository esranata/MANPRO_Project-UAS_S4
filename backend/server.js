const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { readDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ensure database file is initialized/loaded on startup
readDb();

// Import Routes
const authRouter = require('./routes/auth');
const supplierRouter = require('./routes/suppliers');
const warehouseRouter = require('./routes/warehouses');
const goodsRouter = require('./routes/goods');
const distributorRouter = require('./routes/distributors');
const regionRouter = require('./routes/regions');
const userRouter = require('./routes/users');
const logRouter = require('./routes/logs');

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/warehouses', warehouseRouter);
app.use('/api/goods', goodsRouter);
app.use('/api/distributors', distributorRouter);
app.use('/api/regions', regionRouter);
app.use('/api/users', userRouter);
app.use('/api/logs', logRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: "online",
    message: "Master Data Management API is running",
    version: "1.0.0"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Terjadi kesalahan internal pada server!",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
