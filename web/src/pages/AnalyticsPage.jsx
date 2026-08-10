import { useCallback, useEffect, useState } from 'react';
import { RiArrowUpLine, RiBarChartBoxLine, RiGroupLine, RiLineChartLine, RiMoneyDollarCircleLine, RiStarLine } from 'react-icons/ri';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAnalytics } from '../services/api';
import { categoryColor } from '../utils/colors';
import { formatUGX } from '../utils/format';

const tooltipStyle = { backgroundColor: '#1A1A1A', border: '1px solid #2C2C2C', borderRadius: '8px', color: '#fff' };
const axisStyle = { stroke: '#8A8A8A', fontSize: 11 };

const KpiCard = ({ icon, iconBg, iconColor, trend, value, label, delay }) => (
  <div className="bg-bg-card border border-border rounded-card p-5 shadow-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      {trend && <RiArrowUpLine className="w-5 h-5 text-success" />}
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-muted text-sm">{label}</div>
  </div>
);

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnalytics();
      setAnalytics(res.data || {});
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const growthData = analytics?.growthData || [];
  const weeklyData = analytics?.weeklyData || [];
  const services = analytics?.serviceDistribution || [];
  const statuses = analytics?.bookingStatuses || {};
  const completionRate = analytics?.completionRate || 0;
  const avgRating = analytics?.avgRating || 0;
  const totalReviews = analytics?.totalReviews || 0;

  const growthRate =
    growthData.length > 1 && growthData[0].users > 0
      ? (((growthData[growthData.length - 1].users - growthData[0].users) / growthData[0].users) * 100).toFixed(1)
      : '0.0';

  const totalJobs = weeklyData.reduce((a, b) => a + b.jobs, 0);
  const totalRevenue = weeklyData.reduce((a, b) => a + b.revenue, 0);
  const avgTxValue = totalJobs > 0 ? formatUGX(Math.round(totalRevenue / totalJobs)) : formatUGX(0);

  const servicesMax = services.length ? Math.max(...services.map((s) => s.count)) : 1;
  const statusNames = Object.keys(statuses).length ? Object.keys(statuses) : ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
  const statusColors = {
    PENDING: '#F5A623', ACCEPTED: '#3B82F6', ON_THE_WAY: '#8B5CF6', ARRIVED: '#06B6D4',
    IN_PROGRESS: '#F97316', COMPLETED: '#22C55E', CANCELLED: '#8A8A8A', DISPUTED: '#EF4444',
  };

  const kpis = [
    { icon: <RiGroupLine className="w-6 h-6 text-info" />, iconBg: 'bg-info/10', trend: true, value: loading ? '…' : `+${growthRate}%`, label: 'User Growth Rate' },
    { icon: <RiBarChartBoxLine className="w-6 h-6 text-primary" />, iconBg: 'bg-primary/10', trend: true, value: loading ? '…' : `${completionRate}%`, label: 'Job Completion Rate' },
    { icon: <RiMoneyDollarCircleLine className="w-6 h-6 text-success" />, iconBg: 'bg-success/10', trend: true, value: loading ? '…' : avgTxValue, label: 'Avg Transaction Value' },
    { icon: <RiStarLine className="w-6 h-6 text-purple-500" />, iconBg: 'bg-purple-500/10', value: loading ? '…' : `${Number(avgRating).toFixed(1)}/5.0`, label: 'Avg Rating' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-black">Advanced Analytics</h1>
        <p className="text-muted text-sm mt-1">Deep insights into platform performance and trends</p>
      </div>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 100} />
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="animate-pulse bg-bg-card border border-border rounded-card p-5 h-[360px]" />
          <div className="animate-pulse bg-bg-card border border-border rounded-card p-5 h-[360px]" />
        </div>
      ) : (
        <>
          <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
            <h2 className="text-white font-bold text-base mb-4">Platform Growth Metrics</h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                  <XAxis dataKey="month" stroke="#8A8A8A" fontSize={11} />
                  <YAxis stroke="#8A8A8A" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="Users" />
                  <Line type="monotone" dataKey="fundis" stroke="#F5A623" strokeWidth={3} dot={{ fill: '#F5A623', r: 4 }} name="Fundis" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-info rounded-full" /><span className="text-muted text-xs">Total Users</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-primary rounded-full" /><span className="text-muted text-xs">Active Fundis</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <h2 className="text-white font-bold text-base mb-4">Service Distribution</h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={services} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="name">
                      {services.map((entry, index) => (
                        <Cell key={entry.name || index} fill={categoryColor(entry.name, index)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {services.map((s, i) => (
                  <div key={s.name || i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: categoryColor(s.name, i) }} />
                    <span className="text-muted text-xs capitalize truncate">{s.name}</span>
                    <span className="text-white text-xs font-medium ml-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <h2 className="text-white font-bold text-base mb-4">Weekly Booking Activity</h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                    <XAxis dataKey="name" stroke="#8A8A8A" fontSize={11} />
                    <YAxis stroke="#8A8A8A" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="jobs" fill="#F5A623" radius={[6, 6, 0, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <h3 className="text-white font-bold text-sm mb-4">Top Service Categories</h3>
              {services.length === 0 ? (
                <p className="text-muted text-sm py-6 text-center">No data</p>
              ) : (
                <div className="space-y-3">
                  {services.slice(0, 6).map((s, i) => (
                    <div key={s.name || i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted text-sm capitalize">{s.name}</span>
                        <span className="text-white text-sm">{s.count}</span>
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
              <h3 className="text-white font-bold text-sm mb-4">Booking Status Breakdown</h3>
              <div className="space-y-3">
                {statusNames.map((status) => {
                  const count = statuses[status] || 0;
                  const total = statusNames.reduce((a, s) => a + (statuses[s] || 0), 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted text-sm capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="text-white text-sm font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-bg-raised rounded-full h-2">
                        <div className="rounded-full h-2" style={{ width: `${pct}%`, backgroundColor: statusColors[status] || '#8A8A8A' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <h3 className="text-white font-bold text-sm mb-4">Key Performance Indicators</h3>
              <div className="space-y-4">
                {[
                  { metric: 'Customer Satisfaction', value: `${Number(avgRating).toFixed(1)}/5.0`, trend: '+0.2' },
                  { metric: 'Job Completion Rate', value: `${completionRate}%`, trend: '+5%' },
                  { metric: 'Total Reviews', value: totalReviews.toLocaleString(), trend: '+12%' },
                  { metric: 'Weekly Bookings', value: totalJobs.toLocaleString(), trend: '+8%' },
                ].map((kpi, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg-raised rounded-input">
                    <div>
                      <p className="text-muted text-xs mb-1">{kpi.metric}</p>
                      <p className="text-lg font-bold text-white">{kpi.value}</p>
                    </div>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <RiLineChartLine className="w-4 h-4" />
                      <span>{kpi.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
