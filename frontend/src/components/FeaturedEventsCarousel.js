import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import './FeaturedEventsCarousel.css';

const FeaturedEventsCarousel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFeaturedEvents() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/events?featured=true&limit=5');
        if (!response.ok) throw new Error('Failed to fetch featured events');
        const data = await response.json();
        setEvents(data.length ? data : []);
      } catch (err) {
        setError('Could not load featured events.');
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedEvents();
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % events.length);
  const prev = () => setCurrent((prev) => (prev - 1 + events.length) % events.length);

  if (loading) return <div className="text-center"><Spinner animation="border" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!events.length) return <div className="text-muted">No featured events at this time.</div>;

  const event = events[current];

  return (
    <div className="featured-carousel">
      <div className="carousel-card">
        <Card style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
          {event.image_url && (
            <Card.Img variant="top" src={event.image_url} alt={event.title} style={{ height: '220px', objectFit: 'cover', borderRadius: '16px 16px 0 0' }} />
          )}
          <Card.Body>
            <Card.Title style={{ fontWeight: 700 }}>{event.title}</Card.Title>
            <Card.Text style={{ color: '#666' }}>{event.description?.slice(0, 100)}{event.description?.length > 100 ? '...' : ''}</Card.Text>
            <div style={{ color: '#4F8CFF', marginBottom: '0.5rem' }}>
              <FaCalendarAlt /> {new Date(event.date).toLocaleDateString()} &nbsp; <FaMapMarkerAlt /> {event.location}
            </div>
            <div style={{ color: '#FFB347', marginBottom: '0.5rem' }}>
              <FaUsers /> {event.attendeeCount || 0} attending
            </div>
            <Button variant="primary" onClick={() => navigate(`/events/${event.id}`)} style={{ width: '100%' }}>View & RSVP</Button>
          </Card.Body>
        </Card>
      </div>
      {events.length > 1 && (
        <div className="carousel-controls">
          <Button variant="light" onClick={prev} className="me-2">&#8592;</Button>
          <span style={{ fontWeight: 500 }}>{current + 1} / {events.length}</span>
          <Button variant="light" onClick={next} className="ms-2">&#8594;</Button>
        </div>
      )}
    </div>
  );
};

export default FeaturedEventsCarousel;
