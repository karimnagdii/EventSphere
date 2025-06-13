import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
        setStatus('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`http://localhost:5000/api/auth/verify-email/${token}`, { code });
      setStatus('success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError('Invalid or expired verification code. Please try again.');
    }
  };

  return (
    <div className="container fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg,#4F8CFF 60%,#FFB347 100%)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '2rem auto', padding: '2.5rem 2rem', borderRadius: '18px', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
        <h2 className="card-title" style={{ marginBottom: '1.5rem', color: '#4F8CFF' }}>Verify Your Email</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Verification Code</label>
            <input type="text" name="code" className="form-control" value={code} onChange={e => setCode(e.target.value)} required placeholder="Enter the code sent to your email" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Verify</button>
          {error && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;