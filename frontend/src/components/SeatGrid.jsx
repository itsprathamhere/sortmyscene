import styles from './SeatGrid.module.css';

// Group seats by row
function groupByRow(seats) {
  return seats.reduce((acc, seat) => {
    (acc[seat.row] = acc[seat.row] || []).push(seat);
    return acc;
  }, {});
}

export default function SeatGrid({ seats, selected, onToggle, disabled }) {
  const rows = groupByRow(seats);

  return (
    <div className={styles.container}>
      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.available}`} />Available</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.selectedDot}`} />Selected</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.reserved}`} />Reserved</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.booked}`} />Booked</span>
      </div>

      {/* Stage indicator */}
      <div className={styles.stage}>STAGE / SCREEN</div>

      {/* Seat grid */}
      <div className={styles.grid}>
        {Object.entries(rows).sort(([a], [b]) => a.localeCompare(b)).map(([row, rowSeats]) => (
          <div key={row} className={styles.row}>
            <span className={styles.rowLabel}>{row}</span>
            <div className={styles.seats}>
              {rowSeats
                .sort((a, b) => {
                  const an = parseInt(a.seatNumber.replace(/\D/g, ''));
                  const bn = parseInt(b.seatNumber.replace(/\D/g, ''));
                  return an - bn;
                })
                .map((seat) => {
                  const isSelected    = selected.includes(seat.seatNumber);
                  const isUnavailable = seat.status !== 'available';

                  let cls = styles.seat;
                  if (isSelected)           cls += ` ${styles.seatSelected}`;
                  else if (seat.status === 'reserved') cls += ` ${styles.seatReserved}`;
                  else if (seat.status === 'booked')   cls += ` ${styles.seatBooked}`;
                  else                                  cls += ` ${styles.seatAvailable}`;

                  return (
                    <button
                      key={seat._id}
                      className={cls}
                      title={`${seat.seatNumber} — ${seat.status}`}
                      disabled={isUnavailable || disabled}
                      onClick={() => onToggle(seat.seatNumber)}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${seat.seatNumber}, ${seat.status}`}
                    >
                      <span className={styles.seatNum}>
                        {seat.seatNumber.replace(/[A-Z]/g, '')}
                      </span>
                    </button>
                  );
                })}
            </div>
            <span className={styles.rowLabel}>{row}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
