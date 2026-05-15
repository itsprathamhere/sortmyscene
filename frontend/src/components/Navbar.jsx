import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <nav className={styles.nav}>
      <Link to="/events" className={styles.brand}>SortMyScene</Link>

      <div className={styles.right}>
        <span className={styles.userName}>{user?.name}</span>
        <button className={styles.signOut} onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
