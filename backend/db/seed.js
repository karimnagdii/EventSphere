const { db } = require('./database');
const bcrypt = require('bcrypt');

async function ensureAdminUser() {
  // Check if admin exists
  let admin = await db.getAsync('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.runAsync(
      'INSERT INTO users (name, email, password, is_admin, is_active) VALUES (?, ?, ?, 1, 1)',
      ['Admin', 'admin@example.com', hash]
    );
    admin = await db.getAsync('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
  }
  return admin;
}

async function seed() {
  try {
    // Clear existing data (for testing only)
    await db.runAsync('DELETE FROM audit_logs');
    await db.runAsync('DELETE FROM notifications');
    await db.runAsync('DELETE FROM reports');
    await db.runAsync('DELETE FROM rsvps');
    await db.runAsync('DELETE FROM events');
    await db.runAsync('DELETE FROM announcements');
    await db.runAsync('DELETE FROM users WHERE email != "admin@example.com"');

    // Ensure admin user exists and get its id
    const admin = await ensureAdminUser();

    // Create users with avatar URLs
    const users = [
      { name: 'Alice', email: 'alice@example.com', password: 'password1', is_admin: 0, avatar: '/uploads/alice.jpg' },
      { name: 'Bob', email: 'bob@example.com', password: 'password2', is_admin: 0, avatar: '/uploads/bob.jpg' },
      { name: 'Charlie', email: 'charlie@example.com', password: 'password3', is_admin: 0, avatar: '/uploads/charlie.jpg' },
      { name: 'Dana', email: 'dana@example.com', password: 'password4', is_admin: 0, avatar: '/uploads/dana.jpg' },
    ];
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await db.runAsync(
        'INSERT INTO users (name, email, password, is_admin, is_active, avatar) VALUES (?, ?, ?, ?, 1, ?)',
        [user.name, user.email, hash, user.is_admin, user.avatar]
      );
    }

    // Get user IDs
    const allUsers = await db.allAsync('SELECT * FROM users');
    const alice = allUsers.find(u => u.email === 'alice@example.com');
    const bob = allUsers.find(u => u.email === 'bob@example.com');
    const charlie = allUsers.find(u => u.email === 'charlie@example.com');
    const dana = allUsers.find(u => u.email === 'dana@example.com');

    // Create events
    const events = [
      {
        title: 'React Conference',
        description: 'A conference about React and frontend development.',
        location: 'Tech Hall',
        date: '2024-07-10 10:00:00',
        capacity: 100,
        image_url: '/uploads/reactconf.jpg',
        latitude: 40.7128,
        longitude: -74.0060,
        status: 'active',
        created_by: admin.id
      },
      {
        title: 'Node.js Meetup',
        description: 'Meetup for Node.js enthusiasts.',
        location: 'Community Center',
        date: '2024-07-15 18:00:00',
        capacity: 50,
        image_url: '/uploads/nodemeetup.jpg',
        latitude: 34.0522,
        longitude: -118.2437,
        status: 'active',
        created_by: alice.id
      },
      {
        title: 'Startup Pitch Night',
        description: 'Pitch your startup idea to investors.',
        location: 'Innovation Hub',
        date: '2024-08-01 19:00:00',
        capacity: 200,
        image_url: '/uploads/pitchnight.jpg',
        latitude: 37.7749,
        longitude: -122.4194,
        status: 'active',
        created_by: bob.id
      }
    ];
    for (const event of events) {
      await db.runAsync(
        'INSERT INTO events (title, description, location, date, capacity, image_url, latitude, longitude, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [event.title, event.description, event.location, event.date, event.capacity, event.image_url, event.latitude, event.longitude, event.status, event.created_by]
      );
    }

    // Get event IDs
    const allEvents = await db.allAsync('SELECT * FROM events');
    const reactConf = allEvents.find(e => e.title === 'React Conference');
    const nodeMeetup = allEvents.find(e => e.title === 'Node.js Meetup');
    const pitchNight = allEvents.find(e => e.title === 'Startup Pitch Night');

    // RSVPs
    const rsvps = [
      { user_id: alice.id, event_id: reactConf.id, status: 'attending' },
      { user_id: bob.id, event_id: reactConf.id, status: 'maybe' },
      { user_id: charlie.id, event_id: reactConf.id, status: 'attending' },
      { user_id: dana.id, event_id: nodeMeetup.id, status: 'attending' },
      { user_id: admin.id, event_id: nodeMeetup.id, status: 'attending' },
      { user_id: charlie.id, event_id: pitchNight.id, status: 'not_attending' },
      { user_id: bob.id, event_id: pitchNight.id, status: 'attending' }
    ];
    for (const rsvp of rsvps) {
      await db.runAsync(
        'INSERT INTO rsvps (user_id, event_id, status) VALUES (?, ?, ?)',
        [rsvp.user_id, rsvp.event_id, rsvp.status]
      );
    }

    // Announcements
    await db.runAsync(
      'INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)',
      ['Welcome!', 'Welcome to the Event Portal. Stay tuned for updates.', admin.id]
    );

    // Reports
    await db.runAsync(
      'INSERT INTO reports (event_id, reported_by, reason, status) VALUES (?, ?, ?, ?)',
      [reactConf.id, bob.id, 'Spam content', 'pending']
    );

    // Notifications
    await db.runAsync(
      'INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, ?, ?, ?)',
      [alice.id, 'event', 'You have been added to React Conference.', 0]
    );

    console.log('Dummy data inserted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();