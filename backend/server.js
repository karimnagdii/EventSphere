require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/init');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Import admin routes
const adminRoutes = require('./routes/admin');
const { verifyToken } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path, stat) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename and add timestamp
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
    }
});
const upload = multer({ storage });

// Rate limiting
const dynamicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req, res) => {
        // If user is authenticated and admin, set very high limit
        if (req.cookies && req.cookies.authToken) {
            try {
                const decoded = jwt.verify(req.cookies.authToken, JWT_SECRET);
                if (decoded && decoded.isAdmin) return 10000;
                return 1000; // Authenticated user
            } catch (e) {
                // Invalid token, treat as unauthenticated
                return 100;
            }
        }
        return 100; // Unauthenticated
    },
    keyGenerator: (req, res) => {
        // Use user id for authenticated users, IP for others
        if (req.cookies && req.cookies.authToken) {
            try {
                const decoded = jwt.verify(req.cookies.authToken, JWT_SECRET);
                if (decoded && decoded.id) return `user_${decoded.id}`;
            } catch (e) {
                // Invalid token, fall back to IP
            }
        }
        return req.ip;
    },
    handler: (req, res) => {
        return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }
});
app.use(dynamicRateLimit);

// WebSocket server
const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });
});

// Authentication middleware
// const verifyToken = (req, res, next) => {
//     const token = req.cookies.authToken;
//     if (!token) return res.status(401).json({ message: 'Unauthorized' });
//
//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//         if (err) return res.status(403).json({ message: 'Invalid token' });
//         req.user = decoded;
//         next();
//     });
// };

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Mock email service for development
const mockEmailService = {
    sendVerificationEmail: (email, token) => {
        console.log(`[MOCK] Verification email would be sent to ${email} with token ${token}`);
        return Promise.resolve();
    }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR name = ?', [email, name], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Error checking existing user' });
            }
            
            if (existingUser) {
                return res.status(400).json({ message: 'Name or email already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            db.run(
                'INSERT INTO users (name, email, password, email_verified) VALUES (?, ?, ?, 1)',
                [name, email, hashedPassword],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Error creating user' });
                    }
                    res.status(201).json({ message: 'User registered successfully' });
                }
            );
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.get('/api/auth/check', verifyToken, (req, res) => {
    db.get('SELECT id, name, email, is_admin FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ message: 'Error checking auth status' });
        if (!user) return res.status(401).json({ message: 'User not found' });
        res.json(user);
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: email=${email}`);

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Database error during login:', err);
        }
        if (err) return res.status(500).json({ message: 'Error finding user' });
        if (!user) {
            console.log(`Login failed: user not found for email=${email}`);
        }
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        // Prevent banned users from logging in
        if (user.is_active === 0) {
            console.log(`Login failed: user is banned (inactive) for email=${email}`);
            return res.status(403).json({ message: 'Your account has been banned or deactivated.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log(`Login failed: invalid password for email=${email}`);
        }
        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, isAdmin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '7d' }  // Token expires in 7 days
        );

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
        });

        console.log(`Login successful: userId=${user.id}, email=${email}`);
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.is_admin
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/verify-email/:token', (req, res) => {
    const { token } = req.params;

    db.run(
        'UPDATE users SET email_verified = 1 WHERE verification_token = ?',
        [token],
        function(err) {
            if (err) return res.status(500).json({ message: 'Error verifying email' });
            if (this.changes === 0) return res.status(400).json({ message: 'Invalid verification token' });
            res.json({ message: 'Email verified successfully' });
        }
    );
});

// Event routes
app.get('/api/events', (req, res) => {
    const { date, location } = req.query;
    let query = 'SELECT * FROM events WHERE status = "active"';
    const params = [];
    const conditions = [];

    if (date) {
        conditions.push('date LIKE ?');
        params.push(`${date}%`);
    }
    if (location) {
        conditions.push('location LIKE ?');
        params.push(`%${location}%`);
    }

    if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date ASC';

    db.all(query, params, (err, events) => {
        if (err) return res.status(500).json({ message: 'Error fetching events' });
        res.json(events);
    });
});

// Get single event details
app.get('/api/events/:id', (req, res) => {
    const { id } = req.params;
    // Try to get user from token (if present)
    let user = null;
    if (req.cookies && req.cookies.authToken) {
        try {
            user = jwt.verify(req.cookies.authToken, JWT_SECRET);
        } catch (e) {
            user = null;
        }
    }
    db.get('SELECT * FROM events WHERE id = ?', [id], (err, event) => {
        if (err) return res.status(500).json({ message: 'Error fetching event details' });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.status !== 'active') {
            if (user && user.isAdmin) {
                // Admin can view hidden event
                // Get all attendees with their RSVP status, but exclude 'not_attending'
                db.all(
                    `SELECT u.id, u.name, u.email, r.status, r.created_at 
                     FROM rsvps r 
                     JOIN users u ON r.user_id = u.id 
                     WHERE r.event_id = ? AND r.status != 'not_attending'
                     ORDER BY r.created_at DESC`,
                    [id],
                    (err, attendees) => {
                        if (err) {
                            console.error('Error fetching attendees:', err);
                            return res.status(500).json({ message: 'Error fetching attendees' });
                        }
                        event.attendees = attendees || [];
                        event.attendeeCount = (attendees || []).filter(a => a.status === 'attending').length;
                        event._admin_hidden = true;
                        res.json(event);
                    }
                );
            } else {
                // Normal user: event is hidden
                return res.status(403).json({ message: 'This event is hidden.' });
            }
            return;
        }
        // Normal active event
        db.all(
            `SELECT u.id, u.name, u.email, r.status, r.created_at 
             FROM rsvps r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.event_id = ? AND r.status != 'not_attending'
             ORDER BY r.created_at DESC`,
            [id],
            (err, attendees) => {
                if (err) {
                    console.error('Error fetching attendees:', err);
                    return res.status(500).json({ message: 'Error fetching attendees' });
                }
                event.attendees = attendees || [];
                event.attendeeCount = (attendees || []).filter(a => a.status === 'attending').length;
                res.json(event);
            }
        );
    });
});

// Get user's RSVP status for an event
app.get('/api/events/:id/rsvp', verifyToken, (req, res) => {
    const { id } = req.params;
    
    db.get(
        'SELECT status FROM rsvps WHERE event_id = ? AND user_id = ?',
        [id, req.user.id],
        (err, rsvp) => {
            if (err) return res.status(500).json({ message: 'Error fetching RSVP status' });
            res.json({ status: rsvp ? rsvp.status : null });
        }
    );
});

app.post('/api/events', verifyToken, upload.single('image'), (req, res) => {
    const { title, description, location, date, capacity, latitude, longitude } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Validate image file
    if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid image file type. Allowed types: JPEG, PNG, GIF, WEBP' });
        }
    }
    
    db.run(
        'INSERT INTO events (title, description, location, date, capacity, image_url, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, location, date, capacity, imageUrl, latitude, longitude, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ message: 'Error creating event' });
            
            // Notify all clients about new event
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'NEW_EVENT',
                        eventId: this.lastID
                    }));
                }
            });

            res.status(201).json({ 
                id: this.lastID, 
                message: 'Event created successfully',
                imageUrl: imageUrl ? `http://localhost:5000${imageUrl}` : null
            });
        }
    );
});

// RSVP routes
app.post('/api/events/:eventId/rsvp', verifyToken, (req, res) => {
    const { eventId } = req.params;
    const { status } = req.body;

    // First get the event details and current RSVP status
    db.get('SELECT capacity FROM events WHERE id = ?', [eventId], (err, event) => {
        if (err) return res.status(500).json({ message: 'Error fetching event details' });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Get current RSVP status for this user
        db.get('SELECT status FROM rsvps WHERE event_id = ? AND user_id = ?', [eventId, req.user.id], (err, currentRsvp) => {
            if (err) return res.status(500).json({ message: 'Error checking current RSVP status' });

            // Get count of current attendees
            db.get('SELECT COUNT(*) as count FROM rsvps WHERE event_id = ? AND status = ?', [eventId, 'attending'], (err, result) => {
                if (err) return res.status(500).json({ message: 'Error checking attendee count' });

                const currentAttendeeCount = result.count;
                const wasAttending = currentRsvp && currentRsvp.status === 'attending';
                const willAttend = status === 'attending';

                // Check if capacity would be exceeded
                if (willAttend && !wasAttending && currentAttendeeCount >= event.capacity) {
                    return res.status(400).json({ message: 'Event is at full capacity' });
                }

                // Update RSVP status
                db.run(
                    'INSERT OR REPLACE INTO rsvps (user_id, event_id, status) VALUES (?, ?, ?)',
                    [req.user.id, eventId, status],
                    function(err) {
                        if (err) return res.status(500).json({ message: 'Error updating RSVP' });

                        // Notify all clients about RSVP update
                        wss.clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: 'RSVP_UPDATE',
                                    eventId,
                                    userId: req.user.id,
                                    status,
                                    remainingCapacity: event.capacity - (currentAttendeeCount + (willAttend && !wasAttending ? 1 : 0) - (wasAttending && !willAttend ? 1 : 0))
                                }));
                            }
                        });

                        res.json({ 
                            message: 'RSVP updated successfully',
                            remainingCapacity: event.capacity - (currentAttendeeCount + (willAttend && !wasAttending ? 1 : 0) - (wasAttending && !willAttend ? 1 : 0))
                        });
                    }
                );
            });
        });
    });
});

// Report event
app.post('/api/events/:eventId/report', verifyToken, (req, res) => {
    const { eventId } = req.params;
    const { reason } = req.body;
    if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ message: 'A valid reason is required.' });
    }
    db.run(
        'INSERT INTO reports (event_id, reported_by, reason, status) VALUES (?, ?, ?, ?)',
        [eventId, req.user.id, reason, 'pending'],
        function(err) {
            if (err) {
                console.error('Error reporting event:', err);
                return res.status(500).json({ message: 'Error reporting event' });
            }
            res.status(201).json({ message: 'Event reported successfully', reportId: this.lastID });
        }
    );
});

// Admin routes
app.get('/api/admin/events', verifyToken, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    db.all('SELECT * FROM events ORDER by date DESC', (err, events) => {
        if (err) return res.status(500).json({ message: 'Error fetching events' });
        res.json(events);
    });
});

app.get('/api/admin/events/:eventId/attendees', verifyToken, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { eventId } = req.params;
    db.all(
        `SELECT u.name, u.email, r.status, r.created_at 
         FROM rsvps r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.event_id = ?`,
        [eventId],
        (err, attendees) => {
            if (err) return res.status(500).json({ message: 'Error fetching attendees' });
            res.json(attendees);
        }
    );
});

app.post('/api/admin/announcements', verifyToken, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { title, content } = req.body;
    db.run(
        'INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)',
        [title, content, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ message: 'Error creating announcement' });

            // Notify all clients about new announcement
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'NEW_ANNOUNCEMENT',
                        announcementId: this.lastID,
                        title,
                        content
                    }));
                }
            });

            res.status(201).json({ id: this.lastID, message: 'Announcement created successfully' });
        }
    );
});

// Seed sample events
app.post('/api/seed/events', async (req, res) => {
    const sampleEvents = [
        {
            title: 'Tech Conference 2024',
            description: 'Join us for the biggest tech conference of the year!',
            date: '2024-06-15T09:00:00',
            location: 'Convention Center, New York',
            capacity: 500,
            latitude: 40.7128,
            longitude: -74.0060
        },
        {
            title: 'Music Festival',
            description: 'A three-day music festival featuring top artists from around the world.',
            date: '2024-07-20T14:00:00',
            location: 'Central Park, New York',
            capacity: 1000,
            latitude: 40.7829,
            longitude: -73.9654
        },
        {
            title: 'Food & Wine Expo',
            description: 'Sample the finest cuisines and wines from renowned chefs and wineries.',
            date: '2024-08-10T11:00:00',
            location: 'Expo Center, Chicago',
            capacity: 300,
            latitude: 41.8781,
            longitude: -87.6298
        }
    ];

    try {
        for (const event of sampleEvents) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO events (title, description, date, location, capacity, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [event.title, event.description, event.date, event.location, event.capacity, event.latitude, event.longitude],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        res.json({ message: 'Sample events added successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding sample events' });
    }
});

// Admin routes
app.use('/api/admin', verifyToken, adminRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});