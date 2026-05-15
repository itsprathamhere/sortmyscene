const router   = require('express').Router();
const mongoose = require('mongoose');
const Event    = require('../models/Event');
const Seat     = require('../models/Seat');

// GET /api/events — list all events with seat availability counts
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

    const results = await Promise.all(
      events.map(async (event) => {
        const [available, reserved, booked] = await Promise.all([
          Seat.countDocuments({ eventId: event._id, status: 'available' }),
          Seat.countDocuments({ eventId: event._id, status: 'reserved' }),
          Seat.countDocuments({ eventId: event._id, status: 'booked'   }),
        ]);
        return { ...event.toObject(), seatCounts: { available, reserved, booked } };
      })
    );

    res.json(results);
  } catch (err) {
    console.error('Events list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/:id — single event with full seat map
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format to prevent CastError crashes
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid event ID format.' });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const seats = await Seat.find({ eventId: event._id }).sort({ row: 1, seatNumber: 1 });
    res.json({ ...event.toObject(), seats });
  } catch (err) {
    console.error('Event detail error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
