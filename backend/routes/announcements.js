const express = require('express');
const Announcement = require('../models/Announcement');
const EventRegistration = require('../models/EventRegistration');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET ALL ANNOUNCEMENTS with sub-data
router.get('/', requireAuth, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    
    // For each announcement, find its registrations
    const enrichedAnnouncements = await Promise.all(announcements.map(async (a) => {
      const regs = await EventRegistration.find({ announcementId: a._id });
      const aObj = a.toObject();
      aObj.registrations = regs.map(r => ({ userId: r.userId.toString(), payment_status: r.payment_status }));
      return aObj;
    }));

    res.json({ announcements: enrichedAnnouncements });
  } catch (err) {
    console.error('Fetch announcements error:', err);
    res.status(500).json({ error: 'Failed to load announcements.' });
  }
});

// CREATE ANNOUNCEMENT
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, department, year, pdfData, pdfName, fee_amount } = req.body;

    const announcement = new Announcement({
      title, description, category, department, year,
      pdfData, pdfName, fee_amount,
      authorId: req.user.id,
      authorName: req.user.name
    });

    await announcement.save();
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

// DELETE ANNOUNCEMENT
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Promise.all([
      Announcement.findByIdAndDelete(req.params.id),
      EventRegistration.deleteMany({ announcementId: req.params.id })
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

// ADD COMMENT
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found.' });

    announcement.comments.push({
      text,
      authorId: req.user.id,
      authorName: req.user.name
    });

    await announcement.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// REGISTER FOR EVENT (STUDENT)
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Event not found.' });

    const existing = await EventRegistration.findOne({ 
      announcementId: req.params.id, 
      userId: req.user.id 
    });

    if (existing) return res.status(400).json({ error: 'Already registered for this event.' });

    const registration = new EventRegistration({
      announcementId: req.params.id,
      userId: req.user.id,
      payment_status: announcement.fee_amount > 0 ? 'pending' : 'paid'
    });

    await registration.save();
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register for event.' });
  }
});

module.exports = router;
