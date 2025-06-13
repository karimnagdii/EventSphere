import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faUsers, faImage } from '@fortawesome/free-solid-svg-icons';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    capacity: '',
    image: null
  });
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFormData(prev => ({
        ...prev,
        image: e.dataTransfer.files[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      formDataToSend.append('latitude', position.lat);
      formDataToSend.append('longitude', position.lng);

      await axios.post('http://localhost:5000/api/events', formDataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/events');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', borderRadius: '18px', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Create New Event</h2>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} required placeholder="Event Title" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-control" value={formData.description} onChange={handleChange} required rows="4" placeholder="Event Description" />
          </div>
          {/* Step 2: Location & Date */}
          <div className="form-group">
            <label className="form-label">Location Name</label>
            <input type="text" name="location" className="form-control" value={formData.location} onChange={handleChange} required placeholder="Enter location name (e.g., Central Park, New York)" />
          </div>
          <div className="form-group">
            <label className="form-label">Date and Time</label>
            <input type="datetime-local" name="date" className="form-control" value={formData.date} onChange={handleChange} required />
          </div>
          {/* Step 3: Map Selector */}
          <div className="form-group">
            <label className="form-label">Select Location on Map</label>
            <div className="map-container" style={{ height: '300px', borderRadius: '12px', marginBottom: '1rem', overflow: 'hidden' }}>
              <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            {position && (
              <p className="text-muted">Selected coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
            )}
          </div>
          {/* Step 4: Image Upload */}
          <div className="form-group">
            <label className="form-label">Event Image</label>
            <div className={`image-upload-area${dragOver ? ' dragover' : ''}`} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
              <input type="file" name="image" className="form-control" onChange={handleChange} accept="image/*" style={{ display: 'none' }} ref={fileInputRef} />
              <div onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
                {formData.image ? (
                  <img src={URL.createObjectURL(formData.image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', marginBottom: '0.5rem' }} />
                ) : (
                  <span>Drag & drop or click to upload an image</span>
                )}
              </div>
            </div>
          </div>
          {/* Step 5: Capacity */}
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input type="number" name="capacity" className="form-control" value={formData.capacity} onChange={handleChange} required min="1" placeholder="Number of spots" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !position} style={{ width: '100%', marginTop: '1.5rem' }}>
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
          {error && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</div>}
          {/* Confetti animation on success (placeholder) */}
          {success && <div className="confetti" style={{ position: 'absolute', left: '50%', top: '10%', zIndex: 9999 }}>🎉</div>}
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;