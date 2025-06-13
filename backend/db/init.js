const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'event_portal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Helper function to run queries with promises
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

async function initializeDatabase() {
  try {
    // Read the schema file
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim())
      .map(statement => statement + ';');

    // Execute each statement
    for (const statement of statements) {
      await db.runAsync(statement);
    }

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Create default admin user
const bcrypt = require('bcrypt');
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
bcrypt.hash(adminPassword, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing admin password:', err);
        return;
    }

    db.run(
        `INSERT OR IGNORE INTO users (name, email, password, is_admin, email_verified)
         VALUES (?, ?, ?, ?, ?)`,
        ['Admin', 'admin@example.com', hash, 1, 1],
        (err) => {
            if (err) {
                console.error('Error creating admin user:', err);
                return;
            }
            console.log('Default admin user created');
        }
    );
});

if (require.main === module) {
  initializeDatabase();
}

module.exports = db;