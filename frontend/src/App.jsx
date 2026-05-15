import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar       from './components/Navbar';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventList    from './pages/EventList';
import EventDetail  from './pages/EventDetail';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/events" replace /> : children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/"        element={<Navigate to={isAuthenticated ? '/events' : '/login'} replace />} />
        <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/events"     element={<PrivateRoute><EventList /></PrivateRoute>} />
        <Route path="/events/:id" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
