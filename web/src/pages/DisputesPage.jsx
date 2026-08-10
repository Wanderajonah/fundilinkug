import { useCallback, useEffect, useState } from 'react';
import { RiAlertLine, RiCheckDoubleLine, RiMessage2Line, RiRefundLine, RiScalesLine } from 'react-icons/ri';
import { getDisputes, getStats, resolveDispute } from '../services/api';
import { formatDate, formatUGX, readList, toastMessage } from '../utils/format';

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

const statusBadge = (status) => {
  const map = {
    DISPUTED: { label: 'open', cls: 'bg-danger/10 text-danger border-danger/20' },
    open: { label: 'open', cls: 'bg-danger/10 text-danger border-danger/20' },
    COMPLETED: { label: 'resolved', cls: 'bg-success/10 text-success border-success/20' },
    CANCELLED: { label: 'closed', cls: 'bg-gray-500/10 text-muted border-border' },
  };
  const b = map[status] || map.DISPUTED;
  return <span className={`px-2.5 py-1 rounded-pill text-[11px] font-medium border capitalize ${b.cls}`}>{b.label}</span>;
};

const DisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [disputedTotal, setDisputedTotal] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [disputesRes, statsRes] = await Promise.all([getDisputes({ limit: 50 }), getStats()]);
      setDisputes(readList(disputesRes.data, ['disputes', 'data']));
      setDisputedTotal(disputesRes.data?.total || 0);
      setTotalJobs(statsRes.data?.totalJobs || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load disputes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (dispute, resolution) => {
    const label = resolution === 'refund_client' ? 'Refund the client' : resolution === 'release_fundi' ? 'Release payment to fundi' : 'Cancel';
    if (!window.confirm(`${label} for booking ${dispute._id.slice(-6).toUpperCase()}?`)) return;
    setResolving(dispute._id);
    try {
      await resolveDispute(dispute._id, resolution);
      toastMessage(`Dispute ${dispute._id.slice(-6).toUpperCase()} resolved.`);
      load();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to resolve dispute.');
    } finally {
      setResolving('');
    }
  };

  const heldCount = disputes.filter((d) => d.paymentStatus === 'held').length;
  const amounts = disputes.map((d) => d.agreedPrice || d.proposedPrice || 0).filter(Boolean);
  const avgValue = amounts.length ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0;
  const disputeRate = totalJobs > 0 ? ((disputedTotal / totalJobs) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-black">Disputes & Resolution</h1>
        <p className="text-muted text-sm mt-1">Manage conflicts and mediate between clients and fundis</p>
      </div>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<RiAlertLine className="w-6 h-6 text-danger" />} iconBg="bg-danger/10" pulse="bg-danger" value={loading ? '…' : disputedTotal} label="Active Disputes" delay={0} />
        <KpiCard icon={<RiScalesLine className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" value={loading ? '…' : heldCount} label="Escrow Held" delay={100} />
        <KpiCard icon={<RiRefundLine className="w-6 h-6 text-success" />} iconBg="bg-success/10" value={loading ? '…' : formatUGX(avgValue)} label="Avg Dispute Value" delay={200} />
        <KpiCard icon={<RiMessage2Line className="w-6 h-6 text-info" />} iconBg="bg-info/10" value={loading ? '…' : `${disputeRate}%`} label="Dispute Rate" delay={300} />
      </div>

      <div className="bg-bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-white font-bold text-base">All Disputes</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-bg-raised rounded w-32" />
                <div className="h-4 bg-bg-raised rounded w-40" />
                <div className="h-4 bg-bg-raised rounded flex-1" />
              </div>
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-10 text-center text-muted text-sm">No disputes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Booking', 'Client', 'Fundi', 'Reason', 'Value', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left p-4 text-[11px] font-bold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d._id} className="border-b border-border last:border-0 hover:bg-bg-raised/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm text-white">BK-{d._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-white text-sm">{d.clientId?.name || 'Client'}</div>
                      <div className="text-muted text-xs">{d.clientId?.phone || ''}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white text-sm">{d.fundiId?.name || 'Fundi'}</div>
                    </td>
                    <td className="p-4 text-muted text-sm max-w-[200px]">
                      {d.disputeReason || d.description || d.category || '—'}
                    </td>
                    <td className="p-4 text-white text-sm">{formatUGX(d.agreedPrice || d.proposedPrice)}</td>
                    <td className="p-4">{statusBadge(d.status)}</td>
                    <td className="p-4 text-muted text-sm whitespace-nowrap">{formatDate(d.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolve(d, 'refund_client')}
                          disabled={!!resolving}
                          className="px-2.5 py-1.5 bg-success/10 text-success border border-success/20 rounded-input text-xs font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                          title="Refund client"
                        >
                          Refund
                        </button>
                        <button
                          onClick={() => handleResolve(d, 'release_fundi')}
                          disabled={!!resolving}
                          className="px-2.5 py-1.5 bg-info/10 text-info border border-info/20 rounded-input text-xs font-medium hover:bg-info/20 transition-colors disabled:opacity-50"
                          title="Release payment to fundi"
                        >
                          Release
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Common Dispute Reasons</h2>
          <div className="space-y-4">
            {[
              { reason: 'Service not completed', count: 45, percentage: 32 },
              { reason: 'Quality issues', count: 38, percentage: 27 },
              { reason: 'Pricing disputes', count: 28, percentage: 20 },
              { reason: 'Time delays', count: 18, percentage: 13 },
              { reason: 'Damage claims', count: 11, percentage: 8 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted text-sm">{item.reason}</span>
                  <span className="text-white text-sm font-medium">{item.count}</span>
                </div>
                <div className="w-full bg-bg-raised rounded-full h-2">
                  <div className="bg-danger h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Resolution Statistics</h2>
          <div className="space-y-4">
            {[
              { label: 'Resolved in favor of client', value: '58%', icon: <RiCheckDoubleLine className="w-5 h-5 text-success" />, cls: 'bg-success/10 border-success/20 text-success' },
              { label: 'Resolved in favor of fundi', value: '25%', icon: <RiCheckDoubleLine className="w-5 h-5 text-primary" />, cls: 'bg-primary/10 border-primary/20 text-primary' },
              { label: 'Mutual agreement', value: '17%', icon: <RiMessage2Line className="w-5 h-5 text-info" />, cls: 'bg-info/10 border-info/20 text-info' },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between p-4 border rounded-input ${row.cls}`}>
                <div className="flex items-center gap-3">
                  {row.icon}
                  <span className="text-white text-sm font-medium">{row.label}</span>
                </div>
                <span className="text-lg font-bold">{row.value}</span>
              </div>
            ))}
            <div className="p-4 bg-bg-raised rounded-input">
              <div className="flex items-center justify-between">
                <span className="text-muted text-sm">Avg Resolution Time</span>
                <span className="text-white text-lg font-bold">2.4 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputesPage;
