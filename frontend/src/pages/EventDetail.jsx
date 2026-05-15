import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, reserveSeats, confirmBooking } from '../api';
import SeatGrid        from '../components/SeatGrid';
import ReservationTimer from '../components/ReservationTimer';
import BookingModal     from '../components/BookingModal';
import styles from './EventDetail.module.css';

const MAX_SEATS = 8;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

const PHASE = { SELECTING: 'selecting', RESERVED: 'reserved', BOOKED: 'booked' };

export default function EventDetail() {
  const { id }   = useParams();
  const navigate  = useNavigate();

  const [event,       setEvent]       = useState(null);
  const [seats,       setSeats]       = useState([]);
  const [selected,    setSelected]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,       setError]       = useState('');
  const [phase,       setPhase]       = useState(PHASE.SELECTING);
  const [reservation, setReservation] = useState(null);
  const [booking,     setBooking]     = useState(null);

  const fetchEvent = useCallback(async () => {
    try {
      const { data } = await getEvent(id);
      setEvent(data);
      setSeats(data.seats || []);
    } catch {
      setError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const toggleSeat = (seatNumber) => {
    if (phase !== PHASE.SELECTING) return;
    setError('');
    setSelected((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : prev.length < MAX_SEATS
          ? [...prev, seatNumber]
          : (setError(`You can only select up to ${MAX_SEATS} seats at once.`), prev)
    );
  };

  const handleReserve = async () => {
    if (!selected.length) return setError('Please select at least one seat.');
    setError('');
    setActionLoading(true);
    try {
      const { data } = await reserveSeats({ eventId: id, seatNumbers: selected });
      setReservation(data.reservation);
      setSeats((prev) =>
        prev.map((s) =>
          selected.includes(s.seatNumber) ? { ...s, status: 'reserved' } : s
        )
      );
      setPhase(PHASE.RESERVED);
    } catch (err) {
      const msg = err.response?.data;
      if (msg?.unavailableSeats) {
        await fetchEvent();
        setSelected([]);
        setError(
          `Some seats were taken: ${msg.unavailableSeats.map((u) => u.seat).join(', ')}. Please pick different seats.`
        );
      } else {
        setError(msg?.message || 'Reservation failed. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!reservation) return;
    setError('');
    setActionLoading(true);
    try {
      const { data } = await confirmBooking({ reservationId: reservation._id });
      setBooking(data);
      setSeats((prev) =>
        prev.map((s) =>
          selected.includes(s.seatNumber) ? { ...s, status: 'booked' } : s
        )
      );
      setPhase(PHASE.BOOKED);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || 'Booking failed. Please try again.');
      if (err.response?.status === 410) {
        setPhase(PHASE.SELECTING);
        setSelected([]);
        setReservation(null);
        await fetchEvent();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReservationExpire = useCallback(async () => {
    setError('Your reservation expired. Please select seats again.');
    setPhase(PHASE.SELECTING);
    setSelected([]);
    setReservation(null);
    await fetchEvent();
  }, [fetchEvent]);

  const handleCancel = async () => {
    setPhase(PHASE.SELECTING);
    setSelected([]);
    setReservation(null);
    setError('');
    await fetchEvent();
  };

  if (loading) return (
    <div className="page loading-center"><div className="spinner" /></div>
  );

  if (!event) return (
    <div className="page">
      <div className="alert alert-error">Event not found.</div>
      <button className="btn btn-ghost" onClick={() => navigate('/events')}>← Back</button>
    </div>
  );

  const availableCount  = seats.filter((s) => s.status === 'available').length;
  const reservedCount   = seats.filter((s) => s.status === 'reserved').length;
  const bookedCount     = seats.filter((s) => s.status === 'booked').length;

  return (
    <div className="page fade-in">
      <button className={styles.back} onClick={() => navigate('/events')}>
        ← Back
      </button>

      <div className={styles.header}>
        <div>
          <h1 className="page-title">{event.name}</h1>
          <div className={styles.meta}>
            <span>{event.venue}</span>
            <span className={styles.metaDot}>·</span>
            <span>{formatDate(event.date)}</span>
            <span className={styles.metaDot}>·</span>
            <span>{formatTime(event.date)}</span>
          </div>
          {event.description && (
            <p className={styles.desc}>{event.description}</p>
          )}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{availableCount}</span>
            <span className={styles.statLabel}>Available</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{reservedCount}</span>
            <span className={styles.statLabel}>Reserved</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{bookedCount}</span>
            <span className={styles.statLabel}>Booked</span>
          </div>
        </div>
      </div>

      <hr className={styles.hr} />

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className={styles.layout}>
        <div>
          <div className={styles.sectionLabel}>Select Seats</div>
          <SeatGrid
            seats={seats}
            selected={selected}
            onToggle={toggleSeat}
            disabled={phase !== PHASE.SELECTING}
          />
        </div>

        <div className={styles.sidebar}>
          {phase === PHASE.SELECTING && (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Your Selection</div>

              {selected.length === 0 ? (
                <p className={styles.empty}>Click on available seats to select them.</p>
              ) : (
                <>
                  <div className={styles.chips}>
                    {selected.map((s) => (
                      <span key={s} className={styles.chip}>{s}</span>
                    ))}
                  </div>
                  <div className={styles.chipRow}>
                    <span>{selected.length} seat{selected.length > 1 ? 's' : ''}</span>
                    <button
                      className={styles.clearBtn}
                      onClick={() => { setSelected([]); setError(''); }}
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={handleReserve}
                disabled={actionLoading || selected.length === 0}
              >
                {actionLoading ? 'Reserving…' : 'Reserve seats'}
              </button>
              <p className={styles.hint}>Seats held for 10 min after reservation.</p>
            </div>
          )}

          {phase === PHASE.RESERVED && reservation && (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Reserved</div>

              <ReservationTimer
                expiresAt={reservation.expiresAt}
                onExpire={handleReservationExpire}
              />

              <div className={styles.chips} style={{ marginTop: '0.5rem' }}>
                {selected.map((s) => (
                  <span key={s} className={styles.chip}>{s}</span>
                ))}
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={handleConfirmBooking}
                disabled={actionLoading}
              >
                {actionLoading ? 'Confirming…' : 'Confirm booking'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '0.4rem' }}
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          )}

          {phase === PHASE.BOOKED && (
            <div className={styles.panel} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
              <div className={styles.panelTitle}>Booking confirmed</div>
              <p className={styles.empty}>Your seats are secured.</p>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={() => navigate('/events')}
              >
                Browse events
              </button>
            </div>
          )}
        </div>
      </div>

      {phase === PHASE.BOOKED && booking && (
        <BookingModal
          booking={booking}
          onClose={() => navigate('/events')}
        />
      )}
    </div>
  );
}
