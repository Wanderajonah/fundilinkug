import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RiCalendarLine, RiGroupLine, RiMoneyDollarCircleLine, RiUserStarLine } from 'react-icons/ri';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { getAnalytics } from '../services/api';
import { formatDate, formatUGX, getInitials } from '../utils/format';

const pieColors = ['#F5A623', '#3B82F6', '#22C55E', '#E11D48', '#8B5CF6'];

const DashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await getAnalytics();
        setAnalytics(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const bookingsChart = analytics?.bookingsChart || analytics?.bookingsByMonth || [];
  const servicesChart = analytics?.servicesChart || analytics?.topServices || [];
  const recentBookings = analytics?.recentBookings || [];
  const pendingFundis = analytics?.pendingVerifications || analytics?.pendingFundis || [];
  const stats = {
    fundis: analytics?.totalFundis || analytics?.fundis || 0,
    clients: analytics?.totalClients || analytics?.clients || 0,
    bookings: analytics?.totalBookings || analytics?.bookings || 0,
    revenue: analytics?.revenue || analytics?.totalRevenue || 0,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <div className="animate-pulse bg-bg-raised rounded-full w-12 h-12 mb-4" />
              <div className="animate-pulse bg-bg-raised rounded h-8 w-28 mb-3" />
              <div className="animate-pulse bg-bg-raised rounded h-4 w-36" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-bg-card border border-border rounded-card p-5 shadow-card h-80 animate-pulse" />
          <div className="lg:col-span-2 bg-bg-card border border-border rounded-card p-5 shadow-card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<RiUserStarLine />} title="Total Fundis" value={stats.fundis.toLocaleString()} trend="12% this month" iconBg="bg-primary/20" iconColor="text-primary" />
        <StatCard icon={<RiGroupLine />} title="Total Clients" value={stats.clients.toLocaleString()} trend="8% this month" iconBg="bg-info/20" iconColor="text-info" />
        <StatCard icon={<RiCalendarLine />} title="Total Bookings" value={stats.bookings.toLocaleString()} trend="15% this month" iconBg="bg-purple-500/20" iconColor="text-purple-400" />
        <StatCard icon={<RiMoneyDollarCircleLine />} title="Revenue (UGX)" value={formatUGX(stats.revenue)} trend="10% this month" iconBg="bg-primary/20" iconColor="text-primary" valueClass="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Bookings Trend</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                <XAxis dataKey="month" stroke="#8A8A8A" fontSize={11} />
                <YAxis stroke="#8A8A8A" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2C2C2C', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="bookings" stroke="#F5A623" fill="rgba(245,166,35,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Top Services</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={servicesChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {servicesChart.map((entry, index) => (
                    <Cell key={entry.name || index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2C2C2C', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {servicesChart.map((item, index) => (
              <div key={item.name || index} className="flex items-center gap-2 text-muted text-xs">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-bg-card border border-border rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">Recent Bookings</h2>
            <Link to="/bookings" className="text-primary text-sm hover:text-amber-400">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentBookings.length === 0 && <div className="py-10 text-center text-muted">No recent bookings</div>}
            {recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id || booking._id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-white text-sm font-semibold">{booking.service || booking.category || 'Service booking'}</div>
                  <div className="text-muted text-xs">{booking.client?.name || booking.clientName || 'Client'} with {booking.fundi?.name || booking.fundiName || 'Fundi'}</div>
                </div>
                <div className="text-right">
                  <div className="text-primary text-sm font-bold">{formatUGX(booking.amount)}</div>
                  <Badge label={booking.status || 'pending'} type={booking.status === 'completed' ? 'success' : 'warning'} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-2">Pending Verifications</h2>
          {pendingFundis.length === 0 && <div className="py-10 text-center text-muted">No pending fundis</div>}
          {pendingFundis.slice(0, 5).map((fundi) => (
            <div key={fundi.id || fundi._id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">{getInitials(fundi.name)}</div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{fundi.name || fundi.user?.name}</div>
                  <div className="text-muted text-xs truncate">{fundi.trade || fundi.category || 'Artisan'}</div>
                </div>
              </div>
              <Link to="/fundis" className="px-3 py-1 bg-primary text-primary-text text-xs font-bold rounded-pill hover:bg-amber-400 transition-colors">
                Verify
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
