const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    eventId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    seatNumbers: [{ type: String }],
    expiresAt:   { type: Date, required: true },
    status:      {
      type:    String,
      enum:    ['active', 'completed', 'expired'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB auto-removes documents 0 seconds after expiresAt
// (for housekeeping only — the API enforces expiry logic itself)
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Reservation', reservationSchema);
