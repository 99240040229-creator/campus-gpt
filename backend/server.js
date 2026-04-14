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
  origin: true, // Allow all origins in production for simplicity with Vercel/Local mix
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Decode JWT and attach req.user on every request
app.use(attachUser);

// ─── Routes ─────────────────────────────────────────────────────────────────
// All routes are prefixed with /api in vercel.json, but Express also sees its path.
// If we use rewrites, we should handle paths correctly.
app.use('/api/auth',          authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users',         userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), db: 'mongodb', vercel: true });
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
