import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getImageUrl } from '../utils/api';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: '',
    location: ''
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.location) params.append('location', filters.location);

        const response = await axios.get(`http://localhost:5000/api/events?${params}`);
        setEvents(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // Card-based layout, badges, filter/sort UI, map styling, skeleton loader
  return (
    <div className="container fade-in">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title">Events</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label">Date</label>
            <input type="date" name="date" className="form-control" value={filters.date} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label">Location</label>
            <input type="text" name="location" className="form-control" value={filters.location} onChange={handleFilterChange} placeholder="Enter location" />
          </div>
          {/* Add more filter/sort controls here as needed */}
        </div>
      </div>
      <div className="grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {loading ? (
          <div className="event-card skeleton-loader" style={{ width: '100%', minHeight: '200px' }}></div>
        ) : events.map(event => (
          <div key={event.id} className="event-card" style={{ minWidth: '280px', maxWidth: '350px', flex: 1 }}>
            {event.image_url && (
              <img
                src={getImageUrl(event.image_url)}
                alt={event.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="event-badge">{new Date(event.date).toLocaleDateString()}</span>
                <span style={{ color: '#7A869A', marginLeft: '0.5rem' }}><i className="fa fa-map-marker-alt"></i> {event.location}</span>
              </div>
              <h3 style={{ marginTop: 0 }}>{event.title}</h3>
              <p style={{ color: '#666', marginBottom: '1rem' }}>{event.description}</p>
              <Link to={`/events/${event.id}`} className="btn btn-primary" style={{ width: '100%' }}>View Details</Link>
            </div>
          </div>
        ))}
      </div>
      {events.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">Event Locations</h3>
          <div className="map-container" style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
            <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
              {events.map(event => (
                event.latitude && event.longitude && (
                  <Marker key={event.id} position={[event.latitude, event.longitude]}>
                    <Popup>
                      <h3>{event.title}</h3>
                      <p>{event.location}</p>
                      <Link to={`/events/${event.id}`}>View Details</Link>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </div>
      )}
      {events.length === 0 && !loading && (
        <div className="card"><p>No events found matching your criteria.</p></div>
      )}
    </div>
  );
};

export default EventList;