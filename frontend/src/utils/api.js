const API_BASE_URL = 'http://localhost:5000';
const ADMIN_API_BASE = `${API_BASE_URL}/api/admin`;

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Remove any leading slashes to prevent double slashes
  const cleanPath = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
};

export default API_BASE_URL;

// Admin API functions
export const getAdminMetrics = async () => {
    const response = await fetch(`${ADMIN_API_BASE}/metrics`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
};

export const getAdminEvents = async (page = 1, limit = 10) => {
    const response = await fetch(`${ADMIN_API_BASE}/events?page=${page}&limit=${limit}`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
};

export const getAdminUsers = async (page = 1, limit = 10) => {
    const response = await fetch(`${ADMIN_API_BASE}/users?page=${page}&limit=${limit}`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

export const getAdminReports = async (page = 1, limit = 10) => {
    const response = await fetch(`${ADMIN_API_BASE}/reports?page=${page}&limit=${limit}`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
};

export const getAdminSettings = async () => {
    const response = await fetch(`${ADMIN_API_BASE}/settings`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
};

export const updateAdminSettings = async (settings) => {
    const response = await fetch(`${ADMIN_API_BASE}/settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
};

export const updateEventStatus = async (eventId, status) => {
    const response = await fetch(`${ADMIN_API_BASE}/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update event status');
    return response.json();
};

export const updateUserRole = async (userId, isAdmin) => {
    const response = await fetch(`${ADMIN_API_BASE}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ is_admin: isAdmin })
    });
    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
};

export const updateUserStatus = async (userId, isActive) => {
    const response = await fetch(`${ADMIN_API_BASE}/users/${userId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: isActive })
    });
    if (!response.ok) throw new Error('Failed to update user status');
    return response.json();
};

export const updateReportStatus = async (reportId, status) => {
    const response = await fetch(`${ADMIN_API_BASE}/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update report status');
    return response.json();
};

export const exportData = async (type) => {
    const response = await fetch(`${ADMIN_API_BASE}/export/${type}`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to export data');
    return response.text();
};

export const reportEvent = async (eventId, reason) => {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to report event');
    return response.json();
};

export const getReportDetails = async (reportId) => {
    const response = await fetch(`${ADMIN_API_BASE}/reports/${reportId}/details`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch report details');
    return response.json();
};

export const moderateReport = async (reportId, { hideEvent, banCreator, resolveStatus }) => {
    const response = await fetch(`${ADMIN_API_BASE}/reports/${reportId}/action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            action_hide_event: hideEvent,
            action_ban_creator: banCreator,
            action_resolve_status: resolveStatus
        })
    });
    if (!response.ok) throw new Error('Failed to moderate report');
    return response.json();
};

export const getResolvedReports = async () => {
    const response = await fetch(`${ADMIN_API_BASE}/reports/resolved`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch resolved reports');
    return response.json();
};

export const getHiddenEvents = async () => {
    const response = await fetch(`${ADMIN_API_BASE}/events/hidden`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch hidden events');
    return response.json();
};

export const unhideEvent = async (eventId) => {
    const response = await fetch(`${ADMIN_API_BASE}/events/${eventId}/unhide`, {
        method: 'PUT',
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to unhide event');
    return response.json();
};

export const deleteEvent = async (eventId) => {
    const response = await fetch(`${ADMIN_API_BASE}/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to delete event');
    return response.json();
};

export const hideEvent = async (eventId, status = 'archived') => {
    const response = await fetch(`${ADMIN_API_BASE}/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update event status');
    return response.json();
};

// Fetch metrics data for charts
export async function fetchMetricsTimeSeries(type) {
  // Example: GET /api/admin/metrics/timeseries?type=users
  const response = await fetch(`/api/admin/metrics/timeseries?type=${type}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch time series metrics');
  return response.json();
}

export async function fetchMetricsBreakdown(type) {
  // Example: GET /api/admin/metrics/breakdown?type=userRoles
  const response = await fetch(`/api/admin/metrics/breakdown?type=${type}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch breakdown metrics');
  return response.json();
}