const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const { validateEnvironment, config } = require('./backend/config/env');

// Validate environment variables before starting
validateEnvironment();

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database connection with better error handling
const pool = new Pool(config.database);

// Test database connection with better error handling
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('💡 App will continue without database - showing demo data');
    console.error('📄 To fix: Install PostgreSQL and update .env with correct credentials');
  } else {
    console.log('✅ Database connected successfully');
    console.log(`🕒 Server time: ${res.rows[0].now}`);
  }
});

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/businesses', require('./backend/routes/businesses'));
app.use('/api/products', require('./backend/routes/products'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/orders', require('./backend/routes/orders'));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
