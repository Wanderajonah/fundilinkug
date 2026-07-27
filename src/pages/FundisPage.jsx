import { useEffect, useState } from 'react';
import { RiDeleteBinLine, RiEyeLine, RiShieldCheckLine, RiCloseCircleLine } from 'react-icons/ri';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { deleteFundi, getFundis, rejectFundi, verifyFundi } from '../services/api';
import { formatDate, getInitials, readList, toastMessage } from '../utils/format';

const FundisPage = () => {
  const [fundis, setFundis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState(null);

  const loadFundis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getFundis({ search, status: status === 'All' ? undefined : status.toLowerCase() });
      setFundis(readList(res.data, ['fundis', 'data']));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load fundis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFundis();
  }, [status]);

  const q = search.toLowerCase();
  const filteredFundis = fundis.filter((fundi) => `${fundi.name || fundi.user?.name || ''} ${fundi.trade || fundi.category || ''}`.toLowerCase().includes(q));

  const handleAction = async (action, fundi, message) => {
    const id = fundi.id || fundi._id;
    if (action === deleteFundi && !window.confirm('Delete this fundi permanently?')) return;
    if (action === rejectFundi && !window.confirm('Reject this fundi verification?')) return;
    try {
      await action(id);
      toastMessage(message);
      loadFundis();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Action failed.');
    }
  };

  const stats = {
    verified: fundis.filter((f) => f.status === 'verified' || f.verified).length,
    pending: fundis.filter((f) => f.status === 'pending' || f.verificationStatus === 'pending').length,
    rejected: fundis.filter((f) => f.status === 'rejected' || f.verificationStatus === 'rejected').length,
  };

  const columns = [
    { key: 'index', header: '#', render: (_, index) => index + 1 },
    {
      key: 'name',
      header: 'Fundi',
      render: (fundi) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">{getInitials(fundi.name || fundi.user?.name)}</div>
          <div>
            <div className="font-semibold text-white">{fundi.name || fundi.user?.name || 'Unnamed Fundi'}</div>
            <div className="text-muted text-xs">{fundi.trade || fundi.category || 'Skilled Artisan'}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (fundi) => fundi.phone || fundi.user?.phone || 'N/A' },
    { key: 'location', header: 'Location', render: (fundi) => fundi.location || fundi.district || 'N/A' },
    { key: 'rating', header: 'Rating', render: (fundi) => fundi.rating || '0.0' },
    { key: 'joined', header: 'Joined', render: (fundi) => formatDate(fundi.createdAt) },
    { key: 'status', header: 'Status', render: (fundi) => <Badge label={fundi.status || fundi.verificationStatus || (fundi.verified ? 'verified' : 'pending')} type={fundi.verified || fundi.status === 'verified' ? 'success' : fundi.status === 'rejected' ? 'danger' : 'warning'} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (fundi) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setSelected(fundi)} className="p-1.5 text-muted hover:text-info transition-colors" aria-label="View fundi"><RiEyeLine /></button>
          <button onClick={() => handleAction(verifyFundi, fundi, 'Fundi verified.')} className="p-1.5 text-muted hover:text-success transition-colors" aria-label="Verify fundi"><RiShieldCheckLine /></button>
          <button onClick={() => handleAction(rejectFundi, fundi, 'Fundi rejected.')} className="p-1.5 text-muted hover:text-danger transition-colors" aria-label="Reject fundi"><RiCloseCircleLine /></button>
          <button onClick={() => handleAction(deleteFundi, fundi, 'Fundi deleted.')} className="p-1.5 text-muted hover:text-danger transition-colors" aria-label="Delete fundi"><RiDeleteBinLine /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-black">Fundis</h1>
        <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-pill">{filteredFundis.length} Fundis</span>
      </div>
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3 mb-6">{error}</div>}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fundis" className="bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none w-56 focus:border-primary placeholder:text-muted transition-colors duration-200" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none focus:border-primary cursor-pointer">
          {['All', 'Verified', 'Pending', 'Rejected'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card"><div className="text-success text-2xl font-black">{stats.verified}</div><div className="text-muted text-xs">Verified</div></div>
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card"><div className="text-warning text-2xl font-black">{stats.pending}</div><div className="text-muted text-xs">Pending</div></div>
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card"><div className="text-danger text-2xl font-black">{stats.rejected}</div><div className="text-muted text-xs">Rejected</div></div>
      </div>
      <DataTable columns={columns} data={filteredFundis} loading={loading} emptyMessage="No fundis found" />
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-card rounded-b-card">
        <span className="text-muted text-sm">Showing {filteredFundis.length} records</span>
        <div className="flex gap-2"><button className="px-3 py-1.5 bg-bg-raised border border-border rounded-input text-white text-sm hover:border-primary disabled:opacity-40 transition-colors">Prev</button><button className="px-3 py-1.5 bg-bg-raised border border-border rounded-input text-white text-sm hover:border-primary disabled:opacity-40 transition-colors">Next</button></div>
      </div>
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Fundi Profile" size="xl">
        {selected && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-primary/20 to-bg-raised rounded-card p-5 flex items-end gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-primary bg-primary/20 text-primary font-black text-2xl flex items-center justify-center">{getInitials(selected.name || selected.user?.name)}</div>
              <div><h2 className="text-white text-xl font-black">{selected.name || selected.user?.name}</h2><p className="text-muted text-sm">{selected.trade || selected.category} · {selected.location || selected.district}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-bg-raised rounded-input p-4"><div className="text-white font-black">{selected.rating || '0.0'}</div><div className="text-muted text-xs">Rating</div></div>
              <div className="bg-bg-raised rounded-input p-4"><div className="text-white font-black">{selected.completedJobs || 0}</div><div className="text-muted text-xs">Jobs</div></div>
              <div className="bg-bg-raised rounded-input p-4"><div className="text-white font-black">{selected.experience || 0}</div><div className="text-muted text-xs">Years</div></div>
            </div>
            <div className="bg-bg-raised rounded-input p-4"><h3 className="text-white font-bold mb-2">About</h3><p className="text-muted text-sm">{selected.about || selected.bio || 'No profile description provided.'}</p></div>
            <div className="flex flex-wrap gap-2">{(selected.skills || [selected.trade || 'General service']).map((skill) => <span key={skill} className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-pill">{skill}</span>)}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="bg-bg-raised rounded-input h-24 flex items-center justify-center text-muted text-xs">Portfolio</div>)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FundisPage;
