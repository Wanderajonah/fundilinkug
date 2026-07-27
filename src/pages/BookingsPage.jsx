import { useEffect, useState } from 'react';
import { RiEyeLine } from 'react-icons/ri';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { getBookings, updateBookingStatus } from '../services/api';
import { formatDate, formatUGX, readList, toastMessage } from '../utils/format';

const statusSteps = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await getBookings(params);
      const items = readList(res.data, ['bookings', 'data']);
      setBookings(items.map(normalizeBooking));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const normalizeBooking = (b) => ({
    ...b,
    client: b.clientId || { name: b.clientName || 'N/A' },
    fundi: b.fundiId || { name: b.fundiName || 'N/A' },
    amount: b.agreedPrice || b.proposedPrice || 0,
    service: b.category || 'Service',
    method: b.paymentMethod || 'N/A',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const changeStatus = async (status) => {
    try {
      await updateBookingStatus(selected._id, status.toUpperCase());
      toastMessage('Booking status updated.');
      setSelected(null);
      loadBookings();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to update booking status.');
    }
  };

  const columns = [
    { key: 'id', header: 'ID', render: (b) => b._id?.slice(-8) || b.id },
    { key: 'client', header: 'Client', render: (b) => b.client?.name || 'N/A' },
    { key: 'fundi', header: 'Fundi', render: (b) => b.fundi?.name || 'N/A' },
    { key: 'service', header: 'Service', render: (b) => b.service },
    { key: 'date', header: 'Date', render: (b) => formatDate(b.createdAt) },
    { key: 'amount', header: 'Amount', render: (b) => formatUGX(b.amount) },
    { key: 'status', header: 'Status', render: (b) => <Badge label={b.status || 'PENDING'} type={b.status === 'COMPLETED' ? 'success' : b.status === 'CANCELLED' ? 'danger' : 'warning'} /> },
    { key: 'actions', header: 'Actions', render: (b) => <button onClick={() => setSelected(b)} className="p-1.5 text-muted hover:text-info transition-colors" aria-label="View booking"><RiEyeLine /></button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-white text-xl font-black">Bookings</h1><span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-pill">{bookings.length} Bookings</span></div>
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="bg-bg-raised border border-border rounded-input px-3 py-2 text-white text-sm outline-none focus:border-primary [color-scheme:dark]" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="bg-bg-raised border border-border rounded-input px-3 py-2 text-white text-sm outline-none focus:border-primary [color-scheme:dark]" />
        <button onClick={loadBookings} className="px-4 py-2 bg-primary text-primary-text text-sm font-black rounded-pill hover:bg-amber-400 transition-colors">Apply</button>
      </div>
      <DataTable columns={columns} data={bookings} loading={loading} emptyMessage="No bookings found" />
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Booking Detail" size="xl">
        {selected && <div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-4"><div className="bg-bg-raised rounded-input p-4"><h3 className="text-white font-bold mb-2">Client</h3><p className="text-muted text-sm">{selected.client?.name || 'N/A'}</p></div><div className="bg-bg-raised rounded-input p-4"><h3 className="text-white font-bold mb-2">Fundi</h3><p className="text-muted text-sm">{selected.fundi?.name || 'N/A'}</p></div></div><div className="space-y-4"><div className="bg-bg-raised rounded-input p-4"><h3 className="text-white font-bold mb-2">Service</h3><p className="text-muted text-sm">{selected.service}</p></div><div className="bg-bg-raised rounded-input p-4"><h3 className="text-white font-bold mb-2">Payment</h3><p className="text-primary font-black">{formatUGX(selected.amount)}</p></div></div></div><div className="flex items-center justify-between">{statusSteps.map((step, index) => { const active = statusSteps.indexOf(selected.status || 'PENDING') >= index; return <div key={step} className="flex-1 flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-primary text-primary-text' : 'bg-bg-raised text-muted'}`}>{index + 1}</div><div className={`h-0.5 flex-1 ${index === statusSteps.length - 1 ? 'hidden' : active ? 'bg-primary' : 'bg-border'}`} /><span className="sr-only">{step}</span></div>; })}</div><div><h3 className="text-white font-bold mb-3">Update status</h3><div className="flex flex-wrap gap-2">{statusSteps.map((step) => <button key={step} onClick={() => changeStatus(step)} className="px-3 py-1.5 bg-bg-raised border border-border rounded-pill text-white text-xs font-bold hover:border-primary transition-colors">{step.replace(/_/g, ' ')}</button>)}</div></div></div>}
      </Modal>
    </div>
  );
};

export default BookingsPage;
