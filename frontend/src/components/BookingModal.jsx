import styles from './BookingModal.module.css';

export default function BookingModal({ booking, onClose }) {
  if (!booking) return null;

  const { bookingRef, seats, event } = booking;
  const eventDate = event ? new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) : '';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.checkmark}>✓</div>
        <h2 className={styles.title}>Booking Confirmed!</h2>
        <p className={styles.subtitle}>Your seats are locked in</p>

        <div className={styles.ticket}>
          <div className={styles.ticketRow}>
            <span className={styles.ticketLabel}>Booking Ref</span>
            <span className={styles.ticketRef}>{bookingRef}</span>
          </div>
          {event && (
            <>
              <div className={styles.divider} />
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>Event</span>
                <span className={styles.ticketValue}>{event.name}</span>
              </div>
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>Venue</span>
                <span className={styles.ticketValue}>{event.venue}</span>
              </div>
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>Date</span>
                <span className={styles.ticketValue}>{eventDate}</span>
              </div>
            </>
          )}
          <div className={styles.divider} />
          <div className={styles.ticketRow}>
            <span className={styles.ticketLabel}>Seats</span>
            <div className={styles.seatChips}>
              {seats.map((s) => (
                <span key={s} className={styles.chip}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
