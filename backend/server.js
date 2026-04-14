// backend/server.js — Express entry point with MongoDB
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
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'https://campus-gpt-green.vercel.app'
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Decode JWT and attach req.user on every request
app.use(attachUser);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users',         userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), db: 'mongodb' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`🚀  CampusConnect API running at http://localhost:${PORT}`);
});
