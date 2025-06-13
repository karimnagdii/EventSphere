import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaUsers, FaCalendarAlt, FaChartBar, FaCog } from 'react-icons/fa';
import { getAdminMetrics, getAdminEvents, getAdminUsers, getAdminReports, getAdminSettings, updateAdminSettings, exportData, updateUserStatus, moderateReport, getResolvedReports, getHiddenEvents, unhideEvent, deleteEvent } from '../utils/api';
import MetricsCharts from '../components/MetricsCharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [resolvedReports, setResolvedReports] = useState([]);
    const [settings, setSettings] = useState([]);
    const [hiddenEvents, setHiddenEvents] = useState([]);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportDetails, /* setReportDetails */] = useState(null); // setReportDetails is unused
    const [reportActionLoading, setReportActionLoading] = useState(false);
    const [reportActionError, setReportActionError] = useState(null);
    const [hiddenEventActionLoading, setHiddenEventActionLoading] = useState(false);
    const [hiddenEventActionError, setHiddenEventActionError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [metricsData, eventsData, usersData, reportsData, settingsData, resolvedReportsData, hiddenEventsData] = await Promise.all([
                getAdminMetrics(),
                getAdminEvents(),
                getAdminUsers(),
                getAdminReports(),
                getAdminSettings(),
                getResolvedReports(),
                getHiddenEvents()
            ]);
            setMetrics(metricsData || {});
            setEvents((eventsData && eventsData.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []));
            setUsers((usersData && usersData.users) ? usersData.users : []);
            setReports((reportsData && reportsData.reports) ? reportsData.reports.filter(r => r.status === 'pending') : []);
            setResolvedReports((resolvedReportsData && resolvedReportsData.reports) ? resolvedReportsData.reports : []);
            setHiddenEvents((hiddenEventsData && hiddenEventsData.events) ? hiddenEventsData.events : []);
            setSettings(Array.isArray(settingsData) ? settingsData : []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch admin data');
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsUpdate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const updatedSettings = {};
            formData.forEach((value, key) => {
                updatedSettings[key] = value;
            });

            await updateAdminSettings(updatedSettings);
            setShowSettingsModal(false);
            fetchData();
        } catch (err) {
            setError('Failed to update settings');
            console.error('Error updating settings:', err);
        }
    };

    const getSettingDescription = (key) => {
        const descriptions = {
            'site_name': 'The name of the site',
            'admin_email': 'The email address for admin notifications',
            'event_reminder_days': 'Number of days before an event to send reminders',
            'max_users': 'Maximum number of users allowed',
            'user_registration': 'Allow new user registrations',
            'event_creation': 'Allow users to create new events',
            'rsvp_required': 'Require RSVP for event attendance',
            'email_verification': 'Require email verification for new users',
            'password_policy': 'Password complexity requirements',
            'session_timeout': 'Duration (in minutes) before admin session times out',
            'api_rate_limit': 'Maximum number of API requests per hour',
            'log_retention_days': 'Number of days to retain logs',
            'backup_schedule': 'Scheduled time for automatic backups',
            'theme_color': 'Primary color of the site theme',
            'timezone': 'Default timezone for the site',
            'currency': 'Default currency for financial transactions',
            'language': 'Default language for the site',
            'date_format': 'Format for displaying dates',
            'time_format': 'Format for displaying time',
            // ... (keep the rest as before)
        };
        return descriptions[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    // User admin actions
    const handleUserAction = async (user, action) => {
        try {
            if (action === 'ban') {
                await updateUserStatus(user.id, false);
            } else if (action === 'activate') {
                await updateUserStatus(user.id, true);
            } else if (action === 'remove') {
                // TODO: implement remove user endpoint
                alert('Remove user not implemented');
                return;
            } else if (action === 'timeout') {
                // TODO: implement timeout logic
                alert('Timeout user not implemented');
                return;
            }
            setShowUserModal(false);
            fetchData();
        } catch (err) {
            setError('Failed to update user');
        }
    };

    // Report admin actions
    const handleModerateReport = async (options) => {
        if (!selectedReport) return;
        setReportActionLoading(true);
        setReportActionError(null);
        try {
            await moderateReport(selectedReport.id, options);
            setShowReportModal(false);
            fetchData();
        } catch (err) {
            setReportActionError(err.message || 'Failed to perform action');
        } finally {
            setReportActionLoading(false);
        }
    };

    const handleUnhideEvent = async (eventId) => {
        setHiddenEventActionLoading(true);
        setHiddenEventActionError(null);
        try {
            await unhideEvent(eventId);
            fetchData();
        } catch (err) {
            setHiddenEventActionError('Failed to unhide event');
        } finally {
            setHiddenEventActionLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to permanently delete this event?')) return;
        setHiddenEventActionLoading(true);
        setHiddenEventActionError(null);
        try {
            await deleteEvent(eventId);
            fetchData();
        } catch (err) {
            setHiddenEventActionError('Failed to delete event');
        } finally {
            setHiddenEventActionLoading(false);
        }
    };

    // Helper to get active user count for metrics card
    const activeUserCount = (metrics?.active_users !== undefined)
        ? metrics.active_users
        : users.filter(u => u.is_active).length;
    // Helper to get total and resolved reports for metrics card
    const totalReportsCount = (metrics?.total_reports !== undefined)
        ? metrics.total_reports
        : (reports.length + resolvedReports.length);
    const resolvedReportsCount = (metrics?.resolved_reports !== undefined)
        ? metrics.resolved_reports
        : resolvedReports.length;

    if (loading) {
        return <div className="text-center p-5">Loading...</div>;
    }

    return (
        <div className="container py-4">
            <h1 className="mb-4" style={{ fontWeight: 700, color: '#4F8CFF', letterSpacing: '1px' }}>EventSphere Admin Dashboard</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Metrics Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <FaCalendarAlt className="mb-3" size={24} />
                            <h5>Total Events</h5>
                            <h2 className="animated-counter">{metrics?.total_events || 0}</h2>
                            <small>Upcoming: {metrics?.upcoming_events || 0}</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <FaUsers className="mb-3" size={24} />
                            <h5>Total Users</h5>
                            <h2>{metrics?.total_users || users.length || 0}</h2>
                            <small>Active: {activeUserCount}</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <FaChartBar className="mb-3" size={24} />
                            <h5>Total Reports</h5>
                            <h2>{totalReportsCount}</h2>
                            <small>Resolved: {resolvedReportsCount}</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <FaCog className="mb-3" size={24} />
                            <h5>Site Settings</h5>
                            <Button variant="primary" onClick={() => setShowSettingsModal(true)}>
                                Configure
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Events Table */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Recent Events</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id}>
                                    <td>{event.id}</td>
                                    <td>{event.title}</td>
                                    <td>{new Date(event.date).toLocaleString()}</td>
                                    <td>{event.location}</td>
                                    <td>
                                        <Button variant="info" size="sm" onClick={() => navigate(`/events/${event.id}`)}>View</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Users Table */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Recent Users</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>
                                        {/* Replace avatar image with a fancy initial avatar */}
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #4F8CFF 60%, #FFB347 100%)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '1.1rem',
                                            marginRight: '0.5rem',
                                            boxShadow: '0 2px 8px rgba(79,140,255,0.10)'
                                        }}>
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        {user.name}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.is_admin ? 'Admin' : 'User'}</td>
                                    <td>
                                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                            {user.is_active ? 'Active' : 'Banned'}
                                        </span>
                                    </td>
                                    <td>
                                        <Button variant="info" size="sm" title="View User" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>View</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Reports Table */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Pending Reports</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.id}</td>
                                    <td>{report.status}</td>
                                    <td>{new Date(report.created_at).toLocaleString()}</td>
                                    <td>
                                        <Button variant="info" size="sm" onClick={() => { setSelectedReport(report); setShowReportModal(true); }}>View</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Hidden Events Table */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Hidden Events</h5>
                </Card.Header>
                <Card.Body>
                    {hiddenEventActionError && <Alert variant="danger">{hiddenEventActionError}</Alert>}
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hiddenEvents.map(event => (
                                <tr key={event.id}>
                                    <td>{event.id}</td>
                                    <td>{event.title}</td>
                                    <td>{new Date(event.date).toLocaleString()}</td>
                                    <td>{event.location}</td>
                                    <td>
                                        <Button variant="success" size="sm" disabled={hiddenEventActionLoading} onClick={() => handleUnhideEvent(event.id)}>Unhide</Button>{' '}
                                        <Button variant="danger" size="sm" disabled={hiddenEventActionLoading} onClick={() => handleDeleteEvent(event.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {hiddenEvents.length === 0 && <div className="text-muted">No hidden events.</div>}
                </Card.Body>
            </Card>

            {/* Resolved Reports Table */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Resolved Reports</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resolvedReports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.id}</td>
                                    <td>{report.status}</td>
                                    <td>{new Date(report.created_at).toLocaleString()}</td>
                                    <td>{report.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {resolvedReports.length === 0 && <div className="text-muted">No resolved reports.</div>}
                </Card.Body>
            </Card>

            {/* Settings Modal */}
            <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Site Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSettingsUpdate}>
                        {settings.map(setting => (
                            <Form.Group key={setting.key} className="mb-3">
                                <Form.Label>
                                    <strong>{setting.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>
                                    <br />
                                    <span className="text-muted" style={{ fontSize: '0.95em' }}>
                                        {setting.description || getSettingDescription(setting.key)}
                                    </span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name={setting.key}
                                    defaultValue={setting.value}
                                />
                            </Form.Group>
                        ))}
                        <Button type="submit" variant="primary">Save Changes</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* User Modal */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>User Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <div>
                            <h5>{selectedUser.name}</h5>
                            <p>Email: {selectedUser.email}</p>
                            <p>Role: {selectedUser.role}</p>
                            <p>Status: {selectedUser.active ? 'Active' : 'Banned'}</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedUser && (
                        <div>
                            <Button variant="success" onClick={() => handleUserAction(selectedUser, 'activate')}>Activate</Button>
                            <Button variant="danger" onClick={() => handleUserAction(selectedUser, 'ban')}>Ban</Button>
                            <Button variant="secondary" onClick={() => setShowUserModal(false)}>Close</Button>
                        </div>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Report Modal */}
            <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Report Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReport && (
                        <>
                            <p><strong>ID:</strong> {selectedReport.id}</p>
                            <p><strong>Status:</strong> {selectedReport.status}</p>
                            <p><strong>Reason:</strong> {selectedReport.reason}</p>
                            {reportDetails ? (
                                <>
                                    <hr />
                                    <h5>Event Info</h5>
                                    {reportDetails.event ? (
                                        <div>
                                            <p><strong>Title:</strong> {reportDetails.event.title}</p>
                                            <p><strong>Status:</strong> {reportDetails.event.status}</p>
                                            <p><strong>Date:</strong> {new Date(reportDetails.event.date).toLocaleString()}</p>
                                            <p><strong>Location:</strong> {reportDetails.event.location}</p>
                                        </div>
                                    ) : <p className="text-danger">Event not found</p>}
                                    <h5>Event Creator</h5>
                                    {reportDetails.creator ? (
                                        <div>
                                            <p><strong>Name:</strong> {reportDetails.creator.name}</p>
                                            <p><strong>Email:</strong> {reportDetails.creator.email}</p>
                                            <p><strong>Status:</strong> {reportDetails.creator.is_active ? 'Active' : 'Banned'}</p>
                                        </div>
                                    ) : <p className="text-danger">Creator not found</p>}
                                </>
                            ) : <p>Loading event and user details...</p>}
                            {reportActionError && <Alert variant="danger" className="mt-2">{reportActionError}</Alert>}
                            <hr />
                            <Form>
                                <Form.Check type="checkbox" id="hide-event" label="Hide/Remove Event" disabled={reportActionLoading || (reportDetails && reportDetails.event && reportDetails.event.status === 'archived')} />
                                <Form.Check type="checkbox" id="ban-creator" label="Ban Event Creator" disabled={reportActionLoading || (reportDetails && reportDetails.creator && !reportDetails.creator.is_active)} />
                                <Form.Group className="mt-3">
                                    <Form.Label>Resolve Report As</Form.Label>
                                    <Form.Select id="resolve-status" defaultValue="resolved" disabled={reportActionLoading}>
                                        <option value="resolved">Resolved</option>
                                        <option value="dismissed">Dismissed</option>
                                    </Form.Select>
                                </Form.Group>
                                <Button className="mt-3" variant="primary" disabled={reportActionLoading} onClick={async (e) => {
                                    e.preventDefault();
                                    const hideEvent = document.getElementById('hide-event').checked;
                                    const banCreator = document.getElementById('ban-creator').checked;
                                    const resolveStatus = document.getElementById('resolve-status').value;
                                    await handleModerateReport({ hideEvent, banCreator, resolveStatus });
                                }}>
                                    {reportActionLoading ? 'Processing...' : 'Submit Action'}
                                </Button>
                            </Form>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* Site Metrics Charts Section */}
            <div className="card" style={{ margin: '2rem auto', maxWidth: '1000px', textAlign: 'center', padding: '2rem 1rem', borderRadius: '18px', boxShadow: '0 2px 12px rgba(79,140,255,0.07)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Site Metrics</h3>
                <MetricsCharts />
            </div>
        </div>
    );
};

export default AdminDashboard;