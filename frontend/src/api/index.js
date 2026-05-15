import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login    = (data) => api.post('/auth/login',    data);
export const register = (data) => api.post('/auth/register', data);

// ─── Events ──────────────────────────────────────────────────────────────────
export const getEvents  = ()   => api.get('/events');
export const getEvent   = (id) => api.get(`/events/${id}`);

// ─── Reserve & Book ───────────────────────────────────────────────────────────
export const reserveSeats  = (data) => api.post('/reserve',  data);
export const confirmBooking = (data) => api.post('/bookings', data);

export default api;
