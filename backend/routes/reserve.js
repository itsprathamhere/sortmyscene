const router   = require('express').Router();
const mongoose = require('mongoose');
const Seat     = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Event    = require('../models/Event');
const auth     = require('../middleware/auth');

/**
 * Release seats belonging to expired reservations.
 */
async function releaseExpiredReservations(eventId) {
  const now     = new Date();
  const expired = await Reservation.find({
    eventId,
    status: 'active',
    expiresAt: { $lt: now },
  });

  if (!expired.length) return;

  const allExpiredSeats = expired.flatMap((r) => r.seatNumbers);

  await Seat.updateMany(
    { eventId, seatNumber: { $in: allExpiredSeats }, status: 'reserved' },
    { $set: { status: 'available' } }
  );

  await Reservation.updateMany(
    { _id: { $in: expired.map((r) => r._id) } },
    { $set: { status: 'expired' } }
  );
}

// POST /api/reserve
router.post('/', auth, async (req, res) => {
  const { eventId, seatNumbers } = req.body;

  // ── Input validation ───────────────────────────────────────────────
  if (!eventId)
    return res.status(400).json({ message: 'eventId is required.' });

  if (!mongoose.Types.ObjectId.isValid(eventId))
    return res.status(400).json({ message: 'Invalid eventId format.' });

  if (!Array.isArray(seatNumbers) || !seatNumbers.length)
    return res.status(400).json({ message: 'seatNumbers must be a non-empty array.' });

  if (seatNumbers.length > 8)
    return res.status(400).json({ message: 'Maximum 8 seats per reservation.' });

  // Check all seat numbers are non-empty strings
  const invalidSeat = seatNumbers.find((s) => typeof s !== 'string' || !s.trim());
  if (invalidSeat !== undefined)
    return res.status(400).json({ message: 'Each seat number must be a non-empty string.' });

  // Check for duplicates in the request
  const uniqueSeats = [...new Set(seatNumbers)];
  if (uniqueSeats.length !== seatNumbers.length)
    return res.status(400).json({ message: 'Duplicate seat numbers are not allowed.' });

  try {
    // ── Verify event exists ──────────────────────────────────────────
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: 'Event not found.' });

    // ── Check if user already has an active reservation for this event ─
    const existingReservation = await Reservation.findOne({
      userId: req.userId,
      eventId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
    if (existingReservation)
      return res.status(409).json({
        message: 'You already have an active reservation for this event. Please confirm or cancel it first.',
      });

    // 1. Release expired reservations first
    await releaseExpiredReservations(eventId);

    // 2. Verify all requested seats exist in the database
    const seatDocs = await Seat.find({ eventId, seatNumber: { $in: seatNumbers } });
    if (seatDocs.length !== seatNumbers.length) {
      const foundNumbers = seatDocs.map((s) => s.seatNumber);
      const missing = seatNumbers.filter((s) => !foundNumbers.includes(s));
      return res.status(400).json({
        message: `Invalid seat numbers: ${missing.join(', ')}`,
      });
    }

    // 3. Atomically update ONLY available seats
    const result = await Seat.updateMany(
      { eventId, seatNumber: { $in: seatNumbers }, status: 'available' },
      { $set: { status: 'reserved' } }
    );

    if (result.modifiedCount !== seatNumbers.length) {
      // Roll back any partial updates
      await Seat.updateMany(
        { eventId, seatNumber: { $in: seatNumbers }, status: 'reserved' },
        { $set: { status: 'available' } }
      );

      const unavailable = await Seat.find(
        { eventId, seatNumber: { $in: seatNumbers }, status: { $ne: 'available' } },
        'seatNumber status'
      );

      return res.status(409).json({
        message: 'One or more selected seats are no longer available.',
        unavailableSeats: unavailable.map((s) => ({
          seat: s.seatNumber,
          status: s.status,
        })),
      });
    }

    // 4. Create reservation (10-minute window)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await Reservation.create({
      userId: req.userId,
      eventId,
      seatNumbers,
      expiresAt,
    });

    res.status(201).json({ reservation, expiresAt });
  } catch (err) {
    console.error('Reserve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
