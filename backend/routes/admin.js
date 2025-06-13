const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAdmin, logAdminAction } = require('../middleware/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get admin dashboard metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    (SELECT COUNT(*) FROM events) as total_events,
                    (SELECT COUNT(*) FROM events WHERE date > datetime('now')) as upcoming_events,
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM rsvps WHERE status = 'attending') as total_attendees,
                    (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });

        res.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all events with pagination
router.get('/events', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const events = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.*, 
                       u.name as creator_name,
                       (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND status = 'attending') as attendee_count
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const total = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            events,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update event status
router.put('/events/:id/status', logAdminAction('update_event_status', 'event', ':id'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'archived', 'draft'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE events SET status = ? WHERE id = ?', [status, id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({ message: 'Event status updated successfully' });
    } catch (error) {
        console.error('Error updating event status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const users = await new Promise((resolve, reject) => {
            db.all('SELECT id, name, email, is_admin, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const total = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user role
router.put('/users/:id/role', logAdminAction('update_user_role', 'user', ':id'), async (req, res) => {
    const { id } = req.params;
    const { is_admin } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user status
router.put('/users/:id/status', logAdminAction('update_user_status', 'user', ':id'), async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all reports with pagination
router.get('/reports', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const reports = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const total = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM reports', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            reports,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update report status
router.put('/reports/:id/status', logAdminAction('update_report_status', 'report', ':id'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE reports SET status = ? WHERE id = ?', [status, id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({ message: 'Report status updated successfully' });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await new Promise((resolve, reject) => {
            db.all('SELECT key, value FROM settings', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update settings
router.put('/settings', async (req, res) => {
    const updates = req.body;

    try {
        for (const key in updates) {
            await new Promise((resolve, reject) => {
                db.run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [updates[key], key], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get audit logs with pagination
router.get('/logs', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const logs = await new Promise((resolve, reject) => {
            db.all(`
                SELECT l.*, u.name as user_name
                FROM audit_logs l
                LEFT JOIN users u ON l.user_id = u.id
                ORDER BY l.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const total = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM audit_logs', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export data
router.get('/export/:type', async (req, res) => {
    const { type } = req.params;
    let query;

    switch (type) {
        case 'users':
            query = 'SELECT id, name, email, is_admin, is_active, created_at FROM users';
            break;
        case 'events':
            query = 'SELECT * FROM events';
            break;
        case 'rsvps':
            query = 'SELECT * FROM rsvps';
            break;
        case 'logs':
            query = 'SELECT * FROM audit_logs';
            break;
        default:
            return res.status(400).json({ error: 'Invalid export type' });
    }

    try {
        const data = await new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Convert to CSV
        const headers = Object.keys(data[0] || {});
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get detailed info for a report (report, event, creator)
router.get('/reports/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
        const report = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!report) return res.status(404).json({ error: 'Report not found' });
        const event = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM events WHERE id = ?', [report.event_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        let creator = null;
        if (event && event.created_by) {
            creator = await new Promise((resolve, reject) => {
                db.get('SELECT id, name, email, is_admin, is_active FROM users WHERE id = ?', [event.created_by], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
        res.json({ report, event, creator });
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin action on a report: hide event, ban creator, resolve report
router.post('/reports/:id/action', logAdminAction('moderate_report', 'report', ':id'), async (req, res) => {
    const { id } = req.params;
    const { action_hide_event, action_ban_creator, action_resolve_status } = req.body;
    try {
        // Get report and event
        const report = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!report) return res.status(404).json({ error: 'Report not found' });
        const event = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM events WHERE id = ?', [report.event_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (!event) return res.status(404).json({ error: 'Event not found' });
        // Hide/remove event
        if (action_hide_event) {
            await new Promise((resolve, reject) => {
                db.run('UPDATE events SET status = ? WHERE id = ?', ['archived', event.id], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        }
        // Ban creator
        if (action_ban_creator && event.created_by) {
            await new Promise((resolve, reject) => {
                db.run('UPDATE users SET is_active = 0 WHERE id = ?', [event.created_by], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        }
        // Resolve/dismiss report
        if (action_resolve_status && ['resolved', 'dismissed'].includes(action_resolve_status)) {
            await new Promise((resolve, reject) => {
                db.run('UPDATE reports SET status = ? WHERE id = ?', [action_resolve_status, id], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        }
        res.json({ message: 'Admin action completed successfully' });
    } catch (error) {
        console.error('Error moderating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get resolved reports
router.get('/reports/resolved', async (req, res) => {
    try {
        const reports = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM reports WHERE status IN ("resolved", "dismissed") ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json({ reports });
    } catch (error) {
        console.error('Error fetching resolved reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get hidden (archived) events
router.get('/events/hidden', async (req, res) => {
    try {
        const events = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM events WHERE status = "archived" ORDER BY date DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json({ events });
    } catch (error) {
        console.error('Error fetching hidden events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unhide (activate) an event
router.put('/events/:id/unhide', logAdminAction('unhide_event', 'event', ':id'), async (req, res) => {
    const { id } = req.params;
    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE events SET status = "active" WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        res.json({ message: 'Event unhidden (activated) successfully' });
    } catch (error) {
        console.error('Error unhiding event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Permanently delete an event
router.delete('/events/:id', logAdminAction('delete_event', 'event', ':id'), async (req, res) => {
    const { id } = req.params;
    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Metrics: time series (users, events, reports)
router.get('/metrics/timeseries', async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  const { type } = req.query;
  let query = '';
  if (type === 'users') {
    query = `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM users GROUP BY month ORDER BY month`;
  } else if (type === 'events') {
    query = `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM events GROUP BY month ORDER BY month`;
  } else if (type === 'reports') {
    query = `SELECT strftime('%Y-%m', created_at) as month, 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, 
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved 
      FROM reports GROUP BY month ORDER BY month`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
  try {
    db.all(query, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch metrics' });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Metrics: breakdown (userRoles, eventStatuses)
router.get('/metrics/breakdown', async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  const { type } = req.query;
  let query = '';
  if (type === 'userRoles') {
    query = `SELECT CASE WHEN is_admin = 1 THEN 'Admin' ELSE 'User' END as role, COUNT(*) as value FROM users GROUP BY role`;
  } else if (type === 'eventStatuses') {
    query = `SELECT status, COUNT(*) as value FROM events GROUP BY status`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
  try {
    db.all(query, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch breakdown metrics' });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch breakdown metrics' });
  }
});

module.exports = router;