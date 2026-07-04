require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startPinger } = require('./services/pinger');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Strip trailing slash so CORS origin always matches browser origin exactly
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const allowedOrigins = [clientUrl, 'http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

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
