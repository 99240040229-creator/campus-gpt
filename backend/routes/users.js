// backend/routes/users.js — Admin: list & update students
const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// ─── GET /api/users — Admin: list all students with fee summary ───────────────
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    const students = await db.all(
      `SELECT id, name, email, department, year, register_number, batch, section,
              faculty_advisor, created_at
       FROM users WHERE role = 'student' ORDER BY name ASC`
    );

    // For each student, sum the fees from announcements they registered for
    const enriched = await Promise.all(students.map(async (s) => {
      const regs = await db.all(
        `SELECT er.payment_status, a.fee_amount
         FROM event_registrations er
         JOIN announcements a ON er.announcement_id = a.id
         WHERE er.user_id = ?`,
        [s.id]
      );
      const totalFees = regs.reduce((sum, r) => sum + (r.fee_amount || 0), 0);
      const paidFees  = regs.filter(r => (r.payment_status === 'paid')).reduce((sum, r) => sum + (r.fee_amount || 0), 0);
      return { ...s, totalFees, paidFees, balance: totalFees - paidFees };
    }));

    return res.json({ students: enriched });
  } catch (err) {
    console.error('Get students error:', err);
    return res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// ─── PATCH /api/users/:id — Admin: update student academic details ─────────────
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { register_number, batch, year, section, faculty_advisor, department } = req.body;
    const db = await getDb();

    const student = await db.get('SELECT id FROM users WHERE id = ? AND role = ?', [req.params.id, 'student']);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    await db.run(
      `UPDATE users
         SET register_number = ?, batch = ?, year = ?, section = ?, faculty_advisor = ?, department = ?
       WHERE id = ?`,
      [
        register_number || null,
        batch || null,
        year || null,
        section || null,
        faculty_advisor || null,
        department || null,
        req.params.id,
      ]
    );

    const updated = await db.get(
      `SELECT id, name, email, department, year, register_number, batch, section, faculty_advisor, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    return res.json({ user: updated });
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(500).json({ error: 'Failed to update student.' });
  }
});

// ─── GET /api/users/me/fees — Student: get their own fee summary ───────────────
router.get('/me/fees', requireAuth, async (req, res) => {
  try {
    const db = await getDb();

    const regs = await db.all(
      `SELECT er.id, er.payment_status, a.title, a.fee_amount, a.id as announcement_id, er.created_at
       FROM event_registrations er
       JOIN announcements a ON er.announcement_id = a.id
       WHERE er.user_id = ?
       ORDER BY er.created_at DESC`,
      [req.user.id]
    );

    const totalFees = regs.reduce((sum, r) => sum + (r.fee_amount || 0), 0);
    const paidFees  = regs.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + (r.fee_amount || 0), 0);
    const balance   = totalFees - paidFees;

    return res.json({ registrations: regs, totalFees, paidFees, balance });
  } catch (err) {
    console.error('Get fees error:', err);
    return res.status(500).json({ error: 'Failed to fetch fee details.' });
  }
});

// ─── GET /api/users/:id/registrations — Admin: get regs for student ───────
router.get('/:id/registrations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const regs = await db.all(
      `SELECT er.id, er.payment_status, er.created_at, a.title, a.fee_amount
       FROM event_registrations er
       JOIN announcements a ON er.announcement_id = a.id
       WHERE er.user_id = ?
       ORDER BY er.created_at DESC`,
      [req.params.id]
    );
    return res.json({ registrations: regs });
  } catch (err) {
    console.error('Get student registrations error:', err);
    return res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
});

// ─── POST /api/users/registrations/:id/toggle-payment — Admin: toggle status ──
router.post('/registrations/:id/toggle-payment', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const reg = await db.get('SELECT payment_status FROM event_registrations WHERE id = ?', [req.params.id]);
    if (!reg) return res.status(404).json({ error: 'Registration not found.' });

    const newStatus = reg.payment_status === 'paid' ? 'pending' : 'paid';
    await db.run('UPDATE event_registrations SET payment_status = ? WHERE id = ?', [newStatus, req.params.id]);

    return res.json({ success: true, newStatus });
  } catch (err) {
    console.error('Toggle payment error:', err);
    return res.status(500).json({ error: 'Failed to update payment status.' });
  }
});

module.exports = router;
