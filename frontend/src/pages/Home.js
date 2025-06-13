import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import FeaturedEventsCarousel from '../components/FeaturedEventsCarousel';

const Home = () => {
  return (
    <div className="container fade-in">
      <div className="hero" style={{ textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(90deg,#4F8CFF 60%,#6FC3FF 100%)', color: '#fff', borderRadius: '18px', padding: '3rem 1rem', boxShadow: '0 4px 24px rgba(79,140,255,0.13)' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '1px' }}>
          Welcome to EventSphere
        </h1>
        <p style={{ fontSize: '1.3rem', color: '#e6f0ff', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Discover, create, and join amazing events in your area. Modern, beautiful, and easy to use.
        </p>
        <a href="/events" className="btn btn-cta" style={{ fontSize: '1.1rem', padding: '0.75rem 2.5rem' }}>Browse Events</a>
      </div>
      <div className="features grid" style={{ marginBottom: '3rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="feature-card" style={{ minWidth: '220px', maxWidth: '320px' }}>
          <i className="fa fa-calendar-alt" style={{ fontSize: '2.5rem', color: '#4F8CFF', marginBottom: '1rem' }}></i>
          <h3>Browse Events</h3>
          <p>Explore upcoming events in your area. Filter by date, location, and more.</p>
          <a href="/events" className="btn btn-primary" style={{ marginTop: '1rem' }}>View Events</a>
        </div>
        <div className="feature-card" style={{ minWidth: '220px', maxWidth: '320px' }}>
          <i className="fa fa-map-marker-alt" style={{ fontSize: '2.5rem', color: '#FFB347', marginBottom: '1rem' }}></i>
          <h3>Event Locations</h3>
          <p>Find events near you with our interactive map feature.</p>
          <a href="/events" className="btn btn-primary" style={{ marginTop: '1rem' }}>Explore Map</a>
        </div>
        <div className="feature-card" style={{ minWidth: '220px', maxWidth: '320px' }}>
          <i className="fa fa-users" style={{ fontSize: '2.5rem', color: '#4F8CFF', marginBottom: '1rem' }}></i>
          <h3>Create Events</h3>
          <p>Organize your own events and invite others to join.</p>
          <a href="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Event</a>
        </div>
      </div>
      <div className="card" style={{ margin: '2rem auto', maxWidth: '700px', textAlign: 'center', padding: '2rem 1rem', borderRadius: '18px', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '2.2rem', letterSpacing: '1px' }}>Featured Events</h2>
        <FeaturedEventsCarousel />
      </div>
    </div>
  );
};

export default Home;