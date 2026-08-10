import { useCallback, useEffect, useState } from 'react';
import { RiCheckLine, RiCloseCircleLine, RiFileList3Line, RiShieldCheckLine, RiTimeLine } from 'react-icons/ri';
import { getFundis, getStats, rejectFundi, verifyFundi } from '../services/api';
import { formatDate, getInitials, readList, toastMessage } from '../utils/format';

const KpiCard = ({ icon, iconBg, iconColor, pulse, value, label, delay }) => (
  <div
    className="bg-bg-card border border-border rounded-card p-5 shadow-card"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      {pulse && <span className={`w-2 h-2 rounded-full animate-pulse ${pulse}`} />}
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-muted text-sm">{label}</div>
  </div>
);

const VerificationPage = () => {
  const [stats, setStats] = useState({ pendingVerifications: 0, verifiedFundis: 0 });
  const [pending, setPending] = useState([]);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, rejectedRes] = await Promise.all([
        getStats(),
        getFundis({ status: 'pending', limit: 100 }),
        getFundis({ status: 'rejected', limit: 1 }),
      ]);
      setStats(statsRes.data || {});
      setPending(readList(pendingRes.data, ['fundis', 'data']));
      setRejectedCount(rejectedRes.data?.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load verification requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerdict = async (fundi, action) => {
    setActionLoading(fundi._id);
    try {
      const fn = action === 'verify' ? verifyFundi : rejectFundi;
      await fn(fundi._id);
      toastMessage(action === 'verify' ? `${fundi.name || 'Fundi'} verified.` : `${fundi.name || 'Fundi'} rejected.`);
      load();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const approved = stats.verifiedFundis || 0;
  const reviewRate = approved + rejectedCount > 0 ? Math.round((approved / (approved + rejectedCount)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-black">Verification Center</h1>
        <p className="text-muted text-sm mt-1">Review and approve fundi identity verification requests</p>
      </div>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<RiTimeLine className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" pulse="bg-primary" value={loading ? '…' : pending.length} label="Pending Review" delay={0} />
        <KpiCard icon={<RiShieldCheckLine className="w-6 h-6 text-success" />} iconBg="bg-success/10" value={loading ? '…' : approved} label="Verified Fundis" delay={100} />
        <KpiCard icon={<RiCloseCircleLine className="w-6 h-6 text-danger" />} iconBg="bg-danger/10" value={loading ? '…' : rejectedCount} label="Rejected" delay={200} />
        <KpiCard icon={<RiFileList3Line className="w-6 h-6 text-info" />} iconBg="bg-info/10" value={loading ? '…' : `${reviewRate}%`} label="Approval Rate" delay={300} />
      </div>

      {loading ? (
        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-bg-raised" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-bg-raised rounded w-1/3" />
                <div className="h-3 bg-bg-raised rounded w-1/2" />
                <div className="h-3 bg-bg-raised rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 bg-bg-card border border-border rounded-card shadow-card">
            <div className="p-5 border-b border-border">
              <h2 className="text-white font-bold text-base">Verification Queue</h2>
            </div>
            {pending.length === 0 ? (
              <div className="p-10 text-center text-muted text-sm">No pending verifications</div>
            ) : (
              <div className="divide-y divide-border">
                {pending.map((f) => {
                  const profile = f.fundiProfile || {};
                  const skills = profile.skills || [];
                  const docs = profile.verificationDocs || (skills.length ? ['ID', 'Photo'] : ['ID']);
                  return (
                    <div key={f._id} className="p-5 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary text-primary-text font-black flex items-center justify-center shrink-0">
                          {getInitials(f.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-white text-sm font-semibold">{f.name}</h3>
                            <span className="px-2 py-0.5 bg-bg-raised text-muted text-[11px] rounded-pill capitalize">
                              {skills[0] || f.trade || 'Artisan'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-muted text-xs mb-2">
                            <span>{f.email}</span>
                            <span>Submitted: {formatDate(profile.requestedAt || f.createdAt)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {docs.slice(0, 3).map((doc) => (
                              <span key={doc} className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-raised rounded-pill border border-border text-[11px] text-muted">
                                <RiFileList3Line className="text-info" />
                                {doc}
                              </span>
                            ))}
                            <span className="px-2.5 py-1 bg-success/10 rounded-pill border border-success/20 text-[11px] text-success">
                              {skills.length ? `${skills.length} skill${skills.length > 1 ? 's' : ''}` : 'No skills listed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-pill text-primary text-[11px] font-medium capitalize">
                          {profile.verificationStatus || 'pending'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerdict(f, 'verify')}
                            disabled={!!actionLoading}
                            className="w-9 h-9 flex items-center justify-center bg-success/10 text-success border border-success/20 rounded-input hover:bg-success/20 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <RiCheckLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVerdict(f, 'reject')}
                            disabled={!!actionLoading}
                            className="w-9 h-9 flex items-center justify-center bg-danger/10 text-danger border border-danger/20 rounded-input hover:bg-danger/20 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <RiCloseCircleLine className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <h2 className="text-white font-bold text-base mb-4">Verification Checklist</h2>
              <div className="space-y-3">
                {[
                  { item: 'National ID / Passport', required: true, checked: true },
                  { item: 'Professional Certificate', required: true, checked: true },
                  { item: 'Selfie Photo Verification', required: true, checked: true },
                  { item: 'Background Check', required: true, checked: false },
                  { item: 'Trade License (Optional)', required: false, checked: false },
                ].map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-input ${
                      check.checked ? 'bg-success/10 border border-success/20' : 'bg-bg-raised'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          check.checked ? 'bg-success' : 'bg-white/10 border border-border'
                        }`}
                      >
                        {check.checked && <RiCheckLine className="w-3.5 h-3.5 text-primary-text" />}
                      </div>
                      <span className="text-white text-sm">{check.item}</span>
                    </div>
                    {check.required && <span className="text-[11px] px-2 py-0.5 bg-danger/20 text-danger rounded-pill">Required</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
              <h2 className="text-white font-bold text-base mb-4">Verification Stats</h2>
              <div className="space-y-4">
                <div className="p-4 bg-bg-raised rounded-input">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted text-sm">Approval Rate</span>
                    <span className="text-lg font-bold text-success">{reviewRate}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: `${reviewRate}%` }} />
                  </div>
                </div>
                <div className="p-4 bg-bg-raised rounded-input">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-sm">Pending Reviews</span>
                    <span className="text-lg font-bold text-white">{pending.length}</span>
                  </div>
                </div>
                <div className="p-4 bg-bg-raised rounded-input">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-sm">Verified Fundis</span>
                    <span className="text-lg font-bold text-success">{approved}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
