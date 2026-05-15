# SortMyScene — Event Ticket Booking

A full-stack event ticket booking system built with **Node.js + Express + MongoDB** on the backend and **React + Vite** on the frontend.

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** v6+ (running locally, or a MongoDB Atlas URI)
- npm v9+

---

## Running the Backend

```bash
cd backend
npm install

# Create a .env file (copy from the example)
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET

# Seed the database with sample events and seats
npm run seed

# Start the server (dev with auto-reload)
npm run dev

# OR start in production mode
npm start
```

The API will run on **http://localhost:5000**.

---

## Running the Frontend

```bash
cd frontend
npm install

# Start the dev server (proxies /api → localhost:5000 automatically)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Endpoints

| Method | Path              | Auth | Description                                 |
|--------|-------------------|------|---------------------------------------------|
| POST   | /api/auth/register | ✗    | Register a new user                         |
| POST   | /api/auth/login    | ✗    | Login, returns JWT token                    |
| GET    | /api/events        | ✗    | List all events with seat availability      |
| GET    | /api/events/:id    | ✗    | Single event with full seat map             |
| POST   | /api/reserve       | ✓    | Reserve seats (holds for 10 minutes)        |
| POST   | /api/bookings      | ✓    | Confirm booking from an active reservation  |

---

## Assumptions

1. **User identity**: A simple JWT-based auth is used (email + password). No email verification.
2. **Seat layout**: All events use a 6-row × 8-column grid (rows A–F, seats 1–8) totalling 48 seats. This is configured in `seed.js`.
3. **Reservation window**: 10 minutes, hardcoded. In production this would be configurable per event.
4. **Max seats per reservation**: 8 seats per transaction (a reasonable per-user cap).
5. **Payment**: Out of scope — confirmed booking is the final step.
6. **Concurrency model**: Uses single-document atomic operations (`updateMany`) to prevent double-booking. It runs perfectly on standalone MongoDB instances without requiring a replica set.

---

## Design Decisions

### Preventing Double Booking

The core challenge: two users select the same seat simultaneously. The solution uses **atomic MongoDB updates** without relying on multi-document transactions (ensuring compatibility with basic local MongoDB setups):

1. **`POST /api/reserve`**:
   - First, releases any expired reservations (so stale "reserved" seats become available again).
   - Issues a single atomic `updateMany` targeting only seats with `status: 'available'`.
   - Checks `modifiedCount === requested count`. If not, it means at least one seat was taken between the user's selection and the write — the reservation is rolled back by reverting the seats, and a conflict error with the specific unavailable seats is returned to the frontend.
   - Only if all seats updated successfully is the reservation document created.

2. **`POST /api/bookings`**:
   - Verifies the reservation exists, belongs to the requesting user, and is still `active`.
   - Checks `expiresAt < now` — if expired, releases the seats and returns HTTP 410.
   - Promotes seats from `reserved → booked` atomically with another `updateMany`.
   - Checks `modifiedCount` to ensure the exact number of expected seats was promoted.

This approach eliminates race conditions: two simultaneous reserve requests for seat A3 will both execute `updateMany(status: 'available', ...)`, but only one will modify the document. The other gets `modifiedCount = 0` and rolls back cleanly.

### Robust Validation Layer

To ensure data integrity and security, strict validation is enforced on both the client and server:
- **Auth**: Name length constraints (2–50 chars), Password length constraints (6–128 chars), strict Email Regex validation, and automatic input sanitization (trimming/lowercasing).
- **Seat Selections**: Duplicate seat selections within a single request are blocked. Validates all seat names are strings and actually exist in the database for the given event.
- **Data Integrity**: Enforces strict `ObjectId` format validation on `eventId` and `reservationId` endpoints to prevent server crash errors (`CastError`).
- **State Guards**: Blocks users from creating multiple active reservations for the same event to prevent hoarding.

### Frontend State Machine

The `EventDetail` page uses a three-phase state machine (`SELECTING → RESERVED → BOOKED`) to manage the booking flow cleanly, preventing invalid actions at each stage (e.g., re-reserving already reserved seats, double-submitting a booking).

### Expired Reservation Cleanup

Two mechanisms:
- **Active cleanup**: At the start of every `/api/reserve` call, expired reservations for that event are detected and their seats released. This keeps availability accurate without a background job.
- **MongoDB TTL index**: A TTL index on `Reservation.expiresAt` (with `expireAfterSeconds: 0`) auto-deletes the documents after they expire — housekeeping only, the API logic doesn't depend on document presence.

---

## Project Structure

```
sortmyscene/
├── backend/
│   ├── models/         # Mongoose schemas: User, Event, Seat, Reservation
│   ├── routes/         # Express routers: auth, events, reserve, bookings
│   ├── middleware/     # JWT auth middleware
│   ├── seed.js         # Database seed script
│   └── server.js       # Express app entry point
└── frontend/
    └── src/
        ├── api/        # Axios client with JWT interceptor
        ├── context/    # AuthContext (JWT persistence)
        ├── components/ # SeatGrid, ReservationTimer, BookingModal, Navbar
        └── pages/      # LoginPage, RegisterPage, EventList, EventDetail
```
