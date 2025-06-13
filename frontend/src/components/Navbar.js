import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faPlus, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <FontAwesomeIcon icon={faCalendarAlt} /> EventSphere
        </Link>
      </div>
      <div className="navbar-menu">
        <Link to="/events" className="navbar-item">
          Events
        </Link>
        {isAuthenticated && (
          <>
            <Link to="/create-event" className="navbar-item">
              <FontAwesomeIcon icon={faPlus} /> Create Event
            </Link>
            {user.is_admin && (
              <Link to="/admin" className="navbar-item">
                Admin Dashboard
              </Link>
            )}
          </>
        )}
      </div>
      <div className="navbar-end">
        {isAuthenticated ? (
          <>
            <span className="navbar-item">
              <FontAwesomeIcon icon={faUser} /> {user.name}
            </span>
            <button onClick={handleLogout} className="navbar-item logout-button">
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-item">
              Login
            </Link>
            <Link to="/register" className="navbar-item">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;