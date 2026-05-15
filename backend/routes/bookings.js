const router      = require('express').Router();
const mongoose    = require('mongoose');
const Seat        = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Event       = require('../models/Event');
const auth        = require('../middleware/auth');

// POST /api/bookings
router.post('/', auth, async (req, res) => {
  const { reservationId } = req.body;

  // ── Input validation ───────────────────────────────────────────────
  if (!reservationId)
    return res.status(400).json({ message: 'reservationId is required.' });

  if (!mongoose.Types.ObjectId.isValid(reservationId))
    return res.status(400).json({ message: 'Invalid reservationId format.' });

  try {
    // 1. Fetch reservation — must belong to this user and still be active
    const reservation = await Reservation.findOne({
      _id: reservationId,
      userId: req.userId,
      status: 'active',
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found or already used.' });
    }

    // 2. Check expiry
    if (reservation.expiresAt < new Date()) {
      await Seat.updateMany(
        { eventId: reservation.eventId, seatNumber: { $in: reservation.seatNumbers } },
        { $set: { status: 'available' } }
      );
      await Reservation.findByIdAndUpdate(reservationId, { status: 'expired' });
      return res.status(410).json({
        message: 'Your reservation has expired. Please select seats again.',
      });
    }

    // 3. Verify the event still exists
    const event = await Event.findById(reservation.eventId).select('name date venue');
    if (!event) {
      await Reservation.findByIdAndUpdate(reservationId, { status: 'expired' });
      return res.status(404).json({ message: 'The event no longer exists.' });
    }

    // 4. Promote seats: reserved → booked
    const result = await Seat.updateMany(
      {
        eventId:    reservation.eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status:     'reserved',
      },
      { $set: { status: 'booked' } }
    );

    // Verify all seats were actually promoted
    if (result.modifiedCount !== reservation.seatNumbers.length) {
      return res.status(409).json({
        message: 'Some seats could not be booked. They may have been released. Please try again.',
      });
    }

    // 5. Mark reservation complete
    await Reservation.findByIdAndUpdate(reservationId, { status: 'completed' });

    res.json({
      message:    'Booking confirmed!',
      bookingRef: `BK-${reservationId.toString().slice(-8).toUpperCase()}`,
      seats:      reservation.seatNumbers,
      event,
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
