import { useState, useEffect, useCallback } from 'react';
import styles from './ReservationTimer.module.css';

export default function ReservationTimer({ expiresAt, onExpire }) {
  const getRemaining = useCallback(() => {
    const diff = new Date(expiresAt) - Date.now();
    return diff > 0 ? diff : 0;
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!remaining) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r === 0) { clearInterval(id); onExpire?.(); }
    }, 500);
    return () => clearInterval(id);
  }, [remaining, getRemaining, onExpire]);

  const totalMs  = 10 * 60 * 1000;
  const minutes  = Math.floor(remaining / 60000);
  const seconds  = Math.floor((remaining % 60000) / 1000);
  const pct      = (remaining / totalMs) * 100;
  const isUrgent = remaining < 60000;

  return (
    <div className={`${styles.wrapper} ${isUrgent ? styles.urgent : ''}`}>
      <div className={styles.label}>
        <span className={styles.icon}>⏱</span>
        Reservation expires in
      </div>
      <div className={styles.time}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
