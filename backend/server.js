// backend/server.js — Express entry point with MongoDB (Vercel compatible)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./db');

// Connect to MongoDB
connectDB();

const authRoutes         = require('./routes/auth');
const announcementRoutes = require('./routes/announcements');
const userRoutes         = require('./routes/users');
const { attachUser }     = require('./middleware/auth');

const app  = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
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

// ─── Routes ─────────────────────────────────────────────────────────────────
// We mount the routers on both '/' and '/api' to ensure Vercel and Local compatibility
const mountRoutes = (path) => {
  app.use(`${path}/auth`,          authRoutes);
  app.use(`${path}/announcements`, announcementRoutes);
  app.use(`${path}/users`,         userRoutes);
};

mountRoutes('/api'); // For Local development
mountRoutes('');     // For Vercel Serverless routing

// Health check
app.get(['/', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), db: 'mongodb' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// STARTING LOGIC (Only listen if not on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
