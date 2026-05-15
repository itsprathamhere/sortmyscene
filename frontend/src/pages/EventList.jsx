import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../api';
import styles from './EventList.module.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return {
    day:   d.getDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    time:  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    full:  d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

function getCategoryStyle(name) {
  const n = name.toLowerCase();
  if (n.includes('concert') || n.includes('live') || n.includes('music') || n.includes('arijit') || n.includes('coldplay'))
    return { label: 'Music', bg: '#fef3c7', color: '#92400e', icon: '🎵' };
  if (n.includes('comedy') || n.includes('standup'))
    return { label: 'Comedy', bg: '#fce7f3', color: '#9d174d', icon: '🎤' };
  if (n.includes('conference') || n.includes('aws') || n.includes('tech') || n.includes('invent'))
    return { label: 'Tech', bg: '#dbeafe', color: '#1e40af', icon: '💡' };
  if (n.includes('movie') || n.includes('film') || n.includes('knight') || n.includes('orchestral'))
    return { label: 'Cinema', bg: '#ede9fe', color: '#5b21b6', icon: '🎬' };
  if (n.includes('sport') || n.includes('cricket') || n.includes('football'))
    return { label: 'Sports', bg: '#d1fae5', color: '#065f46', icon: '⚽' };
  return { label: 'Event', bg: '#f3f4f6', color: '#374151', icon: '🎪' };
}

export default function EventList() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getEvents();
        setEvents(data);
      } catch {
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="page loading-center">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Discover Events</h1>
          <p className={styles.heroSub}>
            {events.length} upcoming event{events.length !== 1 ? 's' : ''} near you
          </p>
        </div>
      </div>

      <div className={styles.container}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className={styles.grid}>
          {events.map((event) => {
            const dt = formatDate(event.date);
            const available = event.seatCounts?.available ?? 0;
            const total = event.totalSeats;
            const pct = Math.round((available / total) * 100);
            const isSoldOut = available === 0;
            const cat = getCategoryStyle(event.name);

            return (
              <article
                key={event._id}
                className={`${styles.card} ${isSoldOut ? styles.soldOut : ''}`}
                onClick={() => !isSoldOut && navigate(`/events/${event._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !isSoldOut && navigate(`/events/${event._id}`)}
              >
                {/* Date badge */}
                <div className={styles.dateBadge}>
                  <span className={styles.dateDay}>{dt.day}</span>
                  <span className={styles.dateMonth}>{dt.month}</span>
                </div>

                {/* Content */}
                <div className={styles.body}>
                  <div className={styles.topRow}>
                    <span
                      className={styles.category}
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.icon} {cat.label}
                    </span>
                    {isSoldOut && (
                      <span className={styles.soldOutBadge}>Sold Out</span>
                    )}
                  </div>

                  <h2 className={styles.name}>{event.name}</h2>

                  <div className={styles.meta}>
                    <span className={styles.metaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {event.venue}
                    </span>
                    <span className={styles.metaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {dt.full}, {dt.time}
                    </span>
                  </div>

                  {/* Availability bar */}
                  <div className={styles.availability}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${pct}%`,
                          background: pct > 40 ? '#22c55e' : pct > 15 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className={styles.seatCount}>
                      {isSoldOut ? 'No seats available' : `${available} of ${total} seats left`}
                    </span>
                  </div>
                </div>

                {/* Action arrow */}
                {!isSoldOut && (
                  <div className={styles.action}>
                    <span className={styles.bookBtn}>Book →</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
