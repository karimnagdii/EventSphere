import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { fetchMetricsTimeSeries, fetchMetricsBreakdown } from '../utils/api';

const COLORS = ['#4F8CFF', '#FFB347', '#8884d8', '#82ca9d', '#ff8042'];

const MetricsCharts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersOverTime, setUsersOverTime] = useState([]);
  const [eventsOverTime, setEventsOverTime] = useState([]);
  const [reportsOverTime, setReportsOverTime] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [eventStatuses, setEventStatuses] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [users, events, reports, roles, statuses] = await Promise.all([
          fetchMetricsTimeSeries('users'),
          fetchMetricsTimeSeries('events'),
          fetchMetricsTimeSeries('reports'),
          fetchMetricsBreakdown('userRoles'),
          fetchMetricsBreakdown('eventStatuses'),
        ]);
        setUsersOverTime(users);
        setEventsOverTime(events);
        setReportsOverTime(reports);
        setUserRoles(roles);
        setEventStatuses(statuses);
      } catch (err) {
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading charts...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="metrics-charts-grid" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4>Users Over Time</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={usersOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#4F8CFF" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4>Events Over Time</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={eventsOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#FFB347" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4>Reports Over Time</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reportsOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pending" stackId="a" fill="#4F8CFF" />
            <Bar dataKey="resolved" stackId="a" fill="#FFB347" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4>User Roles</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={userRoles} dataKey="value" nameKey="role" cx="50%" cy="50%" outerRadius={80} label>
              {userRoles.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4>Event Statuses</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={eventStatuses} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
              {eventStatuses.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsCharts;
