import { useEffect, useState } from 'react';
import { RiDeleteBinLine, RiEyeLine, RiForbidLine } from 'react-icons/ri';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { getClients, suspendClient } from '../services/api';
import { formatDate, formatUGX, getInitials, readList, toastMessage } from '../utils/format';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await getClients({ search });
      const items = readList(res.data, ['users', 'data']);
      setClients(items.map((c) => ({ ...c, location: c.district || c.locationLabel || 'N/A' })));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = clients.filter((client) => `${client.name || ''} ${client.phone || ''}`.toLowerCase().includes(search.toLowerCase()));

  const handleSuspend = async (client) => {
    if (!window.confirm('Suspend this client account?')) return;
    try {
      await suspendClient(client.id || client._id);
      toastMessage('Client suspended.');
      loadClients();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to suspend client.');
    }
  };

  const columns = [
    { key: 'index', header: '#', render: (_, index) => index + 1 },
    { key: 'name', header: 'Avatar+Name+Phone', render: (client) => <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">{getInitials(client.name)}</div><div><div className="font-semibold text-white">{client.name || 'Client'}</div><div className="text-muted text-xs">{client.phone || 'N/A'}</div></div></div> },
    { key: 'location', header: 'Location', render: (client) => client.location || client.district || 'N/A' },
    { key: 'bookings', header: 'Total Bookings', render: (client) => client.totalBookings || client.bookingsCount || 0 },
    { key: 'joined', header: 'Joined', render: (client) => formatDate(client.createdAt) },
    { key: 'status', header: 'Status', render: (client) => <Badge label={client.status || 'active'} type={(client.status || 'active') === 'suspended' ? 'danger' : 'success'} /> },
    { key: 'actions', header: 'Actions', render: (client) => <div className="flex gap-1"><button onClick={() => setSelected(client)} className="p-1.5 text-muted hover:text-info transition-colors" aria-label="View client"><RiEyeLine /></button><button onClick={() => handleSuspend(client)} className="p-1.5 text-muted hover:text-danger transition-colors" aria-label="Suspend client"><RiForbidLine /></button><button onClick={() => window.confirm('Delete this client?') && toastMessage('Delete client endpoint is not available in the provided API service.')} className="p-1.5 text-muted hover:text-danger transition-colors" aria-label="Delete client"><RiDeleteBinLine /></button></div> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-white text-xl font-black">Clients</h1><span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-pill">{filtered.length} Clients</span></div>
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3 mb-6">{error}</div>}
      <div className="flex items-center gap-3 mb-6 flex-wrap"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" className="bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none w-56 focus:border-primary placeholder:text-muted transition-colors duration-200" /></div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No clients found" />
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Client Details" size="lg">
        {selected && <div className="space-y-4"><div className="flex items-center gap-3"><div className="w-14 h-14 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center">{getInitials(selected.name)}</div><div><div className="text-white font-black">{selected.name}</div><div className="text-muted text-sm">{selected.phone} · {selected.location || 'N/A'}</div></div></div><div className="grid grid-cols-2 gap-3"><div className="bg-bg-raised p-4 rounded-input"><div className="text-white font-black">{selected.totalBookings || 0}</div><div className="text-muted text-xs">Total bookings</div></div><div className="bg-bg-raised p-4 rounded-input"><div className="text-primary font-black">{formatUGX(selected.amountSpent)}</div><div className="text-muted text-xs">Amount spent</div></div></div><div className="bg-bg-raised rounded-input p-4"><h3 className="text-white font-bold mb-3">Recent bookings</h3>{(selected.recentBookings || []).length === 0 ? <p className="text-muted text-sm">No recent bookings.</p> : selected.recentBookings.map((booking) => <div key={booking.id || booking._id} className="py-2 border-b border-border last:border-0 text-sm text-muted">{booking.service} · {formatDate(booking.date)}</div>)}</div></div>}
      </Modal>
    </div>
  );
};

export default ClientsPage;
