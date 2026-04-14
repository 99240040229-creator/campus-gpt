const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payment_status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
