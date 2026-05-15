require('dotenv').config();
const mongoose = require('mongoose');
const Event    = require('./models/Event');
const Seat     = require('./models/Seat');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sortmyscene';

const ROWS           = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEATS_PER_ROW  = 8; // 6 rows × 8 = 48 seats per event

const EVENTS = [
  {
    name:        'Coldplay: Music of the Spheres World Tour',
    date:        new Date('2025-08-15T19:00:00'),
    venue:       'DY Patil Stadium, Mumbai',
    description: 'An audiovisual spectacle of lights, confetti, and pure emotion. The tour finale that broke every record.',
    totalSeats:  48,
    category:    'Concert',
  },
  {
    name:        'The Dark Knight — Live Orchestral Score',
    date:        new Date('2025-07-22T20:30:00'),
    venue:       'NSCI Dome, Mumbai',
    description: "Hans Zimmer's iconic score performed live by a 60-piece orchestra alongside a full 4K screening of the film.",
    totalSeats:  48,
    category:    'Film + Live Score',
  },
  {
    name:        'AWS re:Invent India 2025',
    date:        new Date('2025-09-10T09:00:00'),
    venue:       'Bangalore International Exhibition Centre',
    description: 'India\'s biggest cloud computing conference. Keynotes, deep-dives, workshops, and 5,000+ attendees.',
    totalSeats:  48,
    category:    'Tech Conference',
  },
  {
    name:        'Arijit Singh: Aashiqui Live',
    date:        new Date('2025-10-05T18:30:00'),
    venue:       'Jawaharlal Nehru Stadium, Delhi',
    description: 'An intimate evening of Bollywood\'s most beloved voice — 3 hours, no intermission, pure melody.',
    totalSeats:  48,
    category:    'Concert',
  },
];

function buildSeats(eventId) {
  const seats = [];
  for (const row of ROWS) {
    for (let i = 1; i <= SEATS_PER_ROW; i++) {
      seats.push({ eventId, seatNumber: `${row}${i}`, row });
    }
  }
  return seats;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  await Event.deleteMany({});
  await Seat.deleteMany({});
  console.log('🗑️   Cleared existing data');

  for (const eventData of EVENTS) {
    const event = await Event.create(eventData);
    const seats = buildSeats(event._id);
    await Seat.insertMany(seats);
    console.log(`🎫  Seeded: ${event.name} (${seats.length} seats)`);
  }

  console.log('\n🎉  Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed error:', err);
  process.exit(1);
});
