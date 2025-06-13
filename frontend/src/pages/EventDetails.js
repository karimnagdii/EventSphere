import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faUsers, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { getImageUrl, reportEvent, hideEvent } from '../utils/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Modal, Button, Form } from 'react-bootstrap';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { sendMessage } = useWebSocket();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [remainingCapacity, setRemainingCapacity] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [hideLoading, setHideLoading] = useState(false);
  const [hideError, setHideError] = useState(null);
  const [hideSuccess, setHideSuccess] = useState(null);

  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line
  }, [id, user]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}`, { withCredentials: true });
      setEvent(response.data);
      setRemainingCapacity(response.data.capacity - response.data.attendeeCount);
      setAttendees(response.data.attendees || []);
      if (isAuthenticated) {
        fetchRsvpStatus();
      }
    } catch (err) {
      // If backend returns 403 and message is 'This event is hidden.', handle accordingly
      if (err.response && err.response.status === 403 && err.response.data?.message === 'This event is hidden.') {
        setError('hidden');
      } else {
        setError('Failed to fetch event details');
      }
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRsvpStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}/rsvp`, {
        withCredentials: true
      });
      setRsvpStatus(response.data.status);
    } catch (err) {
      console.error('Error fetching RSVP status:', err);
    }
  };

  const handleRsvp = async (status) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/events/${id}/rsvp`,
        { status },
        { withCredentials: true }
      );
      setRsvpStatus(status);
      setRemainingCapacity(response.data.remainingCapacity);
      fetchEventDetails();
      sendMessage({
        type: 'RSVP_UPDATE',
        eventId: id,
        userId: user.id,
        status
      });
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        console.error('Error updating RSVP:', err);
      }
    }
  };

  const handleReportEvent = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportError(null);
    setReportSuccess(null);
    try {
      await reportEvent(id, reportReason);
      setReportSuccess('Thank you for reporting this event. Our team will review it soon.');
      setReportReason('');
    } catch (err) {
      setReportError(err.message || 'Failed to report event');
    } finally {
      setReportLoading(false);
    }
  };

  const handleHideEvent = async () => {
    setHideLoading(true);
    setHideError(null);
    setHideSuccess(null);
    try {
      await hideEvent(id);
      setHideSuccess('Event has been hidden (archived).');
      fetchEventDetails();
    } catch (err) {
      setHideError(err.message || 'Failed to hide event');
    } finally {
      setHideLoading(false);
    }
  };

  // Show special message for hidden event
  if (error && error.includes('hidden')) {
    return (
      <div className="container">
        <div className="alert alert-warning">This event is hidden.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error || 'Event not found'}</div>
      </div>
    );
  }

  // If admin is viewing a hidden event, show a warning and unhide button
  const isAdminHidden = event._admin_hidden === true;

  const handleUnhideEvent = async () => {
    setHideLoading(true);
    setHideError(null);
    setHideSuccess(null);
    try {
      await hideEvent(id, 'active'); // Reuse hideEvent with status 'active'
      setHideSuccess('Event has been unhidden.');
      fetchEventDetails();
    } catch (err) {
      setHideError(err.message || 'Failed to unhide event');
    } finally {
      setHideLoading(false);
    }
  };

  // Banner, iconography, RSVP buttons, avatar chips, sticky sidebar, related events section
  return (
    <div className="container fade-in">
      <div className="card" style={{ marginBottom: '2rem', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(79,140,255,0.13)' }}>
        {event.image_url && (
          <img src={getImageUrl(event.image_url)} alt={event.title} style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '18px 18px 0 0' }} />
        )}
        <div style={{ padding: '2rem 1.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h2>
          <div style={{ display: 'flex', gap: '1.5rem', color: '#4F8CFF', fontWeight: 500, marginBottom: '1rem' }}>
            <span><i className="fa fa-calendar-alt"></i> {new Date(event.date).toLocaleDateString()}</span>
            <span><i className="fa fa-map-marker-alt"></i> {event.location}</span>
            <span><i className="fa fa-users"></i> {remainingCapacity} spots remaining</span>
          </div>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{event.description}</p>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className={`rsvp-btn${rsvpStatus === 'attending' ? ' selected' : ''}`} onClick={() => handleRsvp('attending')} disabled={remainingCapacity <= 0 && rsvpStatus !== 'attending'}>Attending</button>
            <button className={`rsvp-btn${rsvpStatus === 'maybe' ? ' selected' : ''}`} onClick={() => handleRsvp('maybe')}>Maybe</button>
            <button className={`rsvp-btn${rsvpStatus === 'not_attending' ? ' selected' : ''}`} onClick={() => handleRsvp('not_attending')}>Not Attending</button>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <Button variant="outline-danger" onClick={() => setShowReportModal(true)}>
              Report Event
            </Button>
          </div>
          {/* Add a Hide Event button for admins if event is not archived */}
          {user?.is_admin && (
            event.status !== 'archived' ? (
              <Button variant="warning" style={{ marginBottom: '1rem' }} onClick={handleHideEvent}>
                {hideLoading ? 'Hiding...' : 'Hide Event'}
              </Button>
            ) : (
              <Button variant="success" style={{ marginBottom: '1rem' }} onClick={handleUnhideEvent}>
                {hideLoading ? 'Unhiding...' : 'Unhide Event'}
              </Button>
            )
          )}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title">Attendees</h3>
            <div className="grid">
              {attendees && attendees.length > 0 ? (
                attendees.map(attendee => (
                  // Replace attendee avatar image with a fancy initial avatar
                  <span key={attendee.id} className="avatar-chip" style={{ background: '#F7F9FB', borderRadius: '999px', padding: '0.25rem 0.75rem', margin: '0.25rem', fontSize: '0.95rem', boxShadow: '0 1px 4px rgba(79,140,255,0.07)', display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4F8CFF 60%, #FFB347 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      marginRight: '0.5rem',
                      boxShadow: '0 2px 8px rgba(79,140,255,0.10)'
                    }}>
                      {attendee.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                    {attendee.name}
                  </span>
                ))
              ) : (
                <span className="text-muted">No one has RSVP'd to this event yet.</span>
              )}
            </div>
          </div>
          {/* Sticky sidebar for event actions (desktop only) */}
          <div className="sticky-sidebar" style={{ maxWidth: '320px', margin: '2rem auto' }}>
            <h4>Event Actions</h4>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={() => handleRsvp('attending')}>RSVP Now</button>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowReportModal(true)}>Report Event</button>
          </div>
          {/* Related events section placeholder */}
          <div className="card" style={{ margin: '2rem auto', maxWidth: '700px', textAlign: 'center', padding: '2rem 1rem', borderRadius: '18px', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Related Events</h3>
            <p style={{ color: '#7A869A' }}>Coming soon: A carousel of related/upcoming events.</p>
          </div>
        </div>
      </div>

      {event.latitude && event.longitude && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">Event Location</h3>
          <div className="map-container">
            <MapContainer
              center={[event.latitude, event.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[event.latitude, event.longitude]}>
                <Popup>
                  <h3>{event.title}</h3>
                  <p>{event.location}</p>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Report Event Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Report Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reportSuccess ? (
            <div className="alert alert-success">{reportSuccess}</div>
          ) : (
            <Form onSubmit={handleReportEvent}>
              <Form.Group controlId="reportReason">
                <Form.Label>Please describe the issue:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Enter your reason for reporting this event"
                  disabled={reportLoading}
                />
              </Form.Group>
              {reportError && <div className="alert alert-danger mt-2">{reportError}</div>}
              <Button type="submit" variant="danger" className="mt-3" disabled={reportLoading || reportReason.length < 3}>
                {reportLoading ? 'Reporting...' : 'Submit Report'}
              </Button>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowReportModal(false); setReportSuccess(null); setReportError(null); }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EventDetails;