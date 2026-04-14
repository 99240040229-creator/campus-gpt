// backend/server.js — Express with enhanced error reporting
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./db');

// Connect to MongoDB
connectDB().catch(err => console.error('Initial DB Connect Fail:', err));

const authRoutes         = require('./routes/auth');
const announcementRoutes = require('./routes/announcements');
const userRoutes         = require('./routes/users');
const { attachUser }     = require('./middleware/auth');

const app  = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(attachUser);

// Routes
const mountRoutes = (path) => {
  app.use(`${path}/auth`,          authRoutes);
  app.use(`${path}/announcements`, announcementRoutes);
  app.use(`${path}/users`,         userRoutes);
};

mountRoutes('/api');
mountRoutes('');

app.get(['/', '/api/health'], (_req, res) => {
  res.json({ 
    status: 'ok', 
    db: 'mongodb', 
    env_check: {
      has_uri: !!process.env.MONGODB_URI,
      has_jwt: !!process.env.JWT_SECRET
    }
  });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled internal error:', err);
  // RETURN THE ERROR MESSAGE TO THE BROWSER FOR DEBUGGING
  res.status(500).json({ 
    error: 'Internal server error.', 
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
