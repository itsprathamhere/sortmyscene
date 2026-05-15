const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    eventId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    seatNumber: { type: String, required: true },   // e.g. "A3"
    row:        { type: String, required: true },   // e.g. "A"
    status:     {
      type:    String,
      enum:    ['available', 'reserved', 'booked'],
      default: 'available',
      index:   true,
    },
  },
  { timestamps: true }
);

// Composite unique index: one seat number per event
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
