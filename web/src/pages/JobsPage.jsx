import { useCallback, useEffect, useState } from 'react';
import { RiBriefcaseLine, RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine } from 'react-icons/ri';
import { getAnalytics, getBookings, getStats } from '../services/api';
import { categoryColor } from '../utils/colors';
import { formatDate, formatUGX, readList } from '../utils/format';

const KpiCard = ({ icon, iconBg, iconColor, pulse, value, label, delay }) => (
  <div className="bg-bg-card border border-border rounded-card p-5 shadow-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      {pulse && <span className={`w-2 h-2 rounded-full animate-pulse ${pulse}`} />}
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-muted text-sm">{label}</div>
  </div>
);

const statusBadge = (status = '') => {
  const map = {
    PENDING: 'bg-primary/10 text-primary border-primary/20',
    ACCEPTED: 'bg-info/10 text-info border-info/20',
    ON_THE_WAY: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ARRIVED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    IN_PROGRESS: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    COMPLETED: 'bg-success/10 text-success border-success/20',
    CANCELLED: 'bg-gray-500/10 text-muted border-border',
    DISPUTED: 'bg-danger/10 text-danger border-danger/20',
  };
  const key = String(status).toUpperCase();
  return <span className={`px-2.5 py-1 rounded-pill text-[11px] font-medium capitalize border ${map[key] || 'bg-bg-raised text-muted border-border'}`}>{status.toLowerCase().replace(/_/g, ' ')}</span>;
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [services, setServices] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes, analyticsRes] = await Promise.all([
        getBookings({ limit: 50 }),
        getStats(),
        getAnalytics(),
      ]);
      setJobs(readList(bookingsRes.data, ['bookings', 'data']));
      setStats(statsRes.data || {});
      setServices(analyticsRes.data?.serviceDistribution || []);
      setStatuses(analyticsRes.data?.bookingStatuses || {});
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const servicesMax = services.length ? Math.max(...services.map((s) => s.count)) : 1;
  const statusNames = Object.keys(statuses).length ? Object.keys(statuses) : ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
  const statusTotal = statusNames.reduce((a, s) => a + (statuses[s] || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-black">Jobs & Bookings</h1>
        <p className="text-muted text-sm mt-1">Monitor and manage all service bookings and assignments</p>
      </div>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<RiTimeLine className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" pulse="bg-primary" value={loading ? '…' : (stats.pendingJobs || 0).toLocaleString()} label="Pending" delay={0} />
        <KpiCard icon={<RiBriefcaseLine className="w-6 h-6 text-info" />} iconBg="bg-info/10" value={loading ? '…' : (stats.activeBookings || 0).toLocaleString()} label="Active" delay={100} />
        <KpiCard icon={<RiCheckboxCircleLine className="w-6 h-6 text-success" />} iconBg="bg-success/10" value={loading ? '…' : (stats.completedBookings || 0).toLocaleString()} label="Completed" delay={200} />
        <KpiCard icon={<RiCloseCircleLine className="w-6 h-6 text-danger" />} iconBg="bg-danger/10" value={loading ? '…' : (stats.disputedBookings || 0).toLocaleString()} label="Disputed" delay={300} />
      </div>

      <div className="bg-bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-white font-bold text-base">All Bookings</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-bg-raised rounded w-32" />
                <div className="h-4 bg-bg-raised rounded w-44" />
                <div className="h-4 bg-bg-raised rounded flex-1" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-muted text-sm">No bookings yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Booking', 'Service', 'Client', 'Fundi', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left p-4 text-[11px] font-bold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((b) => (
                  <tr key={b._id} className="border-b border-border last:border-0 hover:bg-bg-raised/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm text-white">BK-{b._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-white text-sm capitalize">{b.category || 'Service'}</div>
                      <div className="text-muted text-xs max-w-[200px] truncate">{b.description}</div>
                    </td>
                    <td className="p-4 text-white text-sm">{b.clientId?.name || 'Client'}</td>
                    <td className="p-4 text-white text-sm">{b.fundiId?.name || 'Unassigned'}</td>
                    <td className="p-4 text-white text-sm">{formatUGX(b.agreedPrice || b.proposedPrice)}</td>
                    <td className="p-4">{statusBadge(b.status)}</td>
                    <td className="p-4 text-muted text-sm whitespace-nowrap">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Top Service Categories</h2>
          {services.length === 0 ? (
            <p className="text-muted text-sm py-6 text-center">No data</p>
          ) : (
            <div className="space-y-4">
              {services.slice(0, 6).map((s, i) => (
                <div key={s.name || i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted text-sm capitalize">{s.name}</span>
                    <span className="text-white text-sm font-medium">{s.count}</span>
                  </div>
                  <div className="w-full bg-bg-raised rounded-full h-2">
                    <div className="rounded-full h-2" style={{ width: `${Math.round((s.count / servicesMax) * 100)}%`, backgroundColor: categoryColor(s.name, i) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Booking Status Breakdown</h2>
          <div className="space-y-3">
            {statusNames.map((status, i) => {
              const count = statuses[status] || 0;
              const pct = statusTotal > 0 ? Math.round((count / statusTotal) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted text-sm capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm font-medium">{count}</span>
                      <span className="text-muted text-xs w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-bg-raised rounded-full h-2">
                    <div className="rounded-full h-2" style={{ width: `${pct}%`, backgroundColor: categoryColor(status.toLowerCase(), i) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
