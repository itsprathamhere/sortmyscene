const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    date:        { type: Date,   required: true },
    venue:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    totalSeats:  { type: Number, required: true, min: 1 },
    category:    { type: String, default: 'General' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
