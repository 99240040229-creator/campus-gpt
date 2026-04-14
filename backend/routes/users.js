const express = require('express');
const User = require('../models/User');
const EventRegistration = require('../models/EventRegistration');
const Announcement = require('../models/Announcement');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET ALL STUDENTS (Admin - includes fee summary)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ name: 1 });

    const enriched = await Promise.all(students.map(async (s) => {
      // Find all registrations for this student
      const regs = await EventRegistration.find({ userId: s._id }).populate('announcementId');
      
      const totalFees = regs.reduce((sum, r) => {
        const fee = r.announcementId?.fee_amount || 0;
        return sum + fee;
      }, 0);

      const paidFees = regs.filter(r => r.payment_status === 'paid').reduce((sum, r) => {
        const fee = r.announcementId?.fee_amount || 0;
        return sum + fee;
      }, 0);

      const sObj = s.toObject();
      return { 
        ...sObj, 
        id: s._id.toString(),
        totalFees, 
        paidFees, 
        balance: totalFees - paidFees 
      };
    }));

    res.json({ students: enriched });
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ error: 'Failed to load student details.' });
  }
});

// GET STUDENT FEES (Student self)
router.get('/me/fees', requireAuth, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ userId: req.user.id }).populate('announcementId');
    
    const registrations = regs.map(r => ({
      id: r._id.toString(),
      title: r.announcementId?.title || 'Unknown Event',
      fee_amount: r.announcementId?.fee_amount || 0,
      payment_status: r.payment_status,
      created_at: r.createdAt
    }));

    const totalFees = registrations.reduce((sum, r) => sum + r.fee_amount, 0);
    const paidFees  = registrations.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.fee_amount, 0);

    res.json({
      totalFees,
      paidFees,
      balance: totalFees - paidFees,
      registrations
    });
  } catch (err) {
    console.error('Fetch my fees error:', err);
    res.status(500).json({ error: 'Failed to load fee details.' });
  }
});

// UPDATE STUDENT (Admin)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const s = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Student not found.' });
    res.json({ success: true, student: s });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

// GET REGISTRATIONS FOR STUDENT (Admin)
router.get('/:id/registrations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ userId: req.params.id }).populate('announcementId');
    const results = regs.map(r => ({
      id: r._id.toString(),
      payment_status: r.payment_status,
      created_at: r.createdAt,
      title: r.announcementId?.title || 'Unknown',
      fee_amount: r.announcementId?.fee_amount || 0
    }));
    res.json({ registrations: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
});

// TOGGLE PAYMENT STATUS (Admin)
router.post('/registrations/:id/toggle-payment', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reg = await EventRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found.' });

    reg.payment_status = reg.payment_status === 'paid' ? 'pending' : 'paid';
    await reg.save();

    res.json({ success: true, newStatus: reg.payment_status });
  } catch (err) {
    console.error('Toggle payment error:', err);
    res.status(500).json({ error: 'Failed to update payment status.' });
  }
});

module.exports = router;
