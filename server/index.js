require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startPinger } = require('./services/pinger');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' || "http://localhost:5174" || "https://api-moniter-system-rh3c.vercel.app" }));
app.use(express.json());

// Health check (public)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/apis', verifyToken, require('./routes/apis'));

// Start
const init = async () => {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    startPinger();
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err.message);
    process.exit(1);
  });
};

init();
