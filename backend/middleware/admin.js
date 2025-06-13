const { db } = require('../db/database');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    db.get('SELECT is_admin FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) {
            console.error('Error checking admin status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!row || !row.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    });
};

// Middleware to log admin actions
const logAdminAction = (actionType, targetType, targetId, details = null) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function(data) {
            // Log the action after the response is sent
            db.run(
                'INSERT INTO audit_logs (user_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, actionType, targetType, targetId, details ? JSON.stringify(details) : null],
                (err) => {
                    if (err) {
                        console.error('Error logging admin action:', err);
                    }
                }
            );
            return originalJson.call(this, data);
        };
        next();
    };
};

module.exports = {
    requireAdmin,
    logAdminAction
}; 