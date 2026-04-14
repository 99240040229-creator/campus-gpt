// backend/routes/announcements.js — Announcements + Comments CRUD
const express  = require('express');
const multer   = require('multer');
const { getDb } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const crypto = require('crypto');

const router  = express.Router();

// Use memory storage so we can save raw Buffer into SQLite BLOB
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
});

// ─── Helper: attach comments and registrations to each announcement ───────────────────────────
async function attachExtras(announcements) {
  if (announcements.length === 0) return announcements;
  const ids = announcements.map(a => a.id);
  const placeholders = ids.map(() => '?').join(',');
  
  const db = await getDb();
  const comments = await db.all(
    `SELECT id, announcement_id, text, author_id, author_name, created_at
     FROM comments WHERE announcement_id IN (${placeholders})
     ORDER BY created_at ASC`,
    ids
  );

  const registrations = await db.all(
    `SELECT r.id, r.announcement_id, r.user_id, r.user_name, r.payment_status, u.email as user_email, r.created_at
     FROM event_registrations r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.announcement_id IN (${placeholders})
     ORDER BY r.created_at ASC`,
    ids
  );

  const byAnnouncement = {};
  const regsByAnnouncement = {};

  comments.forEach(c => {
    if (!byAnnouncement[c.announcement_id]) byAnnouncement[c.announcement_id] = [];
    byAnnouncement[c.announcement_id].push(c);
  });

  registrations.forEach(r => {
    if (!regsByAnnouncement[r.announcement_id]) regsByAnnouncement[r.announcement_id] = [];
    regsByAnnouncement[r.announcement_id].push(r);
  });

  return announcements.map(a => ({
    ...a,
    pdfData: a.pdf_data
      ? `data:${a.pdf_mime || 'application/pdf'};base64,${Buffer.from(a.pdf_data).toString('base64')}`
      : null,
    pdf_data: undefined, // strip raw buffer
    comments: byAnnouncement[a.id] || [],
    registrations: regsByAnnouncement[a.id] || [],
  }));
}

// ─── GET /api/announcements ─────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT id, title, description, pdf_data, pdf_name, pdf_mime,
              department, year, category, fee_amount, author_id, author_name, created_at
       FROM announcements
       ORDER BY created_at DESC`
    );
    const result = await attachExtras(rows);
    return res.json({ announcements: result });
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

// ─── POST /api/announcements — Admin only ───────────────────────────────────
router.post('/', requireAuth, requireAdmin, upload.single('pdf'), async (req, res) => {
  try {
    const { title, description, department, year, category, feeAmount } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const pdfBuffer  = req.file ? req.file.buffer   : null;
    const pdfName    = req.file ? req.file.originalname : null;
    const pdfMime    = req.file ? req.file.mimetype  : null;
    const id         = crypto.randomUUID();

    const db = await getDb();
    await db.run(
      `INSERT INTO announcements
         (id, title, description, pdf_data, pdf_name, pdf_mime, department, year, category, fee_amount, author_id, author_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        description,
        pdfBuffer,
        pdfName,
        pdfMime,
        department || 'All',
        year       || 'All',
        category   || 'Academic',
        parseFloat(feeAmount) || 0,
        req.user.id,
        req.user.name,
      ]
    );

    // Return all announcements so frontend stays in sync
    const rows = await db.all(
      `SELECT id, title, description, pdf_data, pdf_name, pdf_mime,
              department, year, category, fee_amount, author_id, author_name, created_at
       FROM announcements ORDER BY created_at DESC`
    );
    const result = await attachExtras(rows);
    return res.status(201).json({ announcements: result });
  } catch (err) {
    console.error('Post announcement error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'PDF file must be less than 2 MB.' });
    }
    return res.status(500).json({ error: err.message || 'Failed to post announcement.' });
  }
});

// ─── DELETE /api/announcements/:id — Admin only ─────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    return res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    return res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

// ─── POST /api/announcements/:id/comments ───────────────────────────────────
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const db = await getDb();

    // Verify announcement exists
    const ann = await db.get('SELECT id FROM announcements WHERE id = ?', [req.params.id]);
    if (!ann) return res.status(404).json({ error: 'Announcement not found.' });

    const id = crypto.randomUUID();

    await db.run(
      `INSERT INTO comments (id, announcement_id, text, author_id, author_name)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.params.id, text.trim(), req.user.id, req.user.name]
    );

    // Return updated comments for this announcement
    const comments = await db.all(
      `SELECT id, announcement_id, text, author_id, author_name, created_at
       FROM comments WHERE announcement_id = ? ORDER BY created_at ASC`,
      [req.params.id]
    );
    return res.status(201).json({ comments });
  } catch (err) {
    console.error('Post comment error:', err);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// ─── POST /api/announcements/:id/register ───────────────────────────────────
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const db = await getDb();

    // Verify announcement exists
    const ann = await db.get('SELECT id, category, fee_amount FROM announcements WHERE id = ?', [req.params.id]);
    if (!ann) return res.status(404).json({ error: 'Announcement not found.' });

    if (ann.category !== 'Event' && ann.category !== 'Events') {
       return res.status(400).json({ error: 'Can only register for events.' });
    }

    const id = crypto.randomUUID();

    try {
      await db.run(
        `INSERT INTO event_registrations (id, announcement_id, user_id, user_name, payment_status)
         VALUES (?, ?, ?, ?, ?)`,
        [id, req.params.id, req.user.id, req.user.name, ann.fee_amount > 0 ? 'paid' : 'free']
      );
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
         return res.status(400).json({ error: 'You are already registered for this event.' });
      }
      throw err;
    }

    // Return updated registrations for this announcement
    const registrations = await db.all(
      `SELECT r.id, r.announcement_id, r.user_id, r.user_name, r.payment_status, u.email as user_email, r.created_at
       FROM event_registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.announcement_id = ? ORDER BY r.created_at ASC`,
      [req.params.id]
    );
    return res.status(201).json({ registrations });
  } catch (err) {
    console.error('Post registration error:', err);
    return res.status(500).json({ error: 'Failed to register for event.' });
  }
});

module.exports = router;
