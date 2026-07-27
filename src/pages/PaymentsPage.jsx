import { useEffect, useState } from 'react';
import { RiEyeLine } from 'react-icons/ri';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { getPayments, releaseEscrow } from '../services/api';
import { formatDate, formatUGX, readList, toastMessage } from '../utils/format';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments();
      setPayments(readList(res.data, ['payments', 'data']));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const held = payments.filter((p) => p.escrow === 'held').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const released = payments.filter((p) => p.escrow === 'released').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleRelease = async (payment) => {
    if (!window.confirm('Release escrow for this payment?')) return;
    try {
      await releaseEscrow(payment.id || payment._id);
      toastMessage('Escrow released.');
      loadPayments();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to release escrow.');
    }
  };

  const columns = [
    { key: 'payId', header: 'Pay ID', render: (p) => p.payId || p.id || p._id },
    { key: 'bookingId', header: 'Booking ID', render: (p) => p.bookingId || p.booking?._id || 'N/A' },
    { key: 'client', header: 'Client', render: (p) => p.client?.name || p.clientName || 'N/A' },
    { key: 'fundi', header: 'Fundi', render: (p) => p.fundi?.name || p.fundiName || 'N/A' },
    { key: 'amount', header: 'Amount', render: (p) => formatUGX(p.amount) },
    { key: 'method', header: 'Method', render: (p) => <span className={p.method === 'Airtel' ? 'bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-pill' : 'bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-pill'}>{p.method || 'MTN'}</span> },
    { key: 'status', header: 'Status', render: (p) => <Badge label={p.status || 'paid'} type={p.status === 'failed' ? 'danger' : 'success'} /> },
    { key: 'escrow', header: 'Escrow', render: (p) => <Badge label={p.escrow || 'held'} type={p.escrow === 'released' ? 'success' : p.escrow === 'refunded' ? 'info' : 'warning'} /> },
    { key: 'date', header: 'Date', render: (p) => formatDate(p.createdAt || p.date) },
    { key: 'actions', header: 'Actions', render: (p) => <div className="flex items-center gap-2"><button className="p-1.5 text-muted hover:text-info transition-colors" aria-label="View payment"><RiEyeLine /></button>{(p.escrow || 'held') === 'held' && <button onClick={() => handleRelease(p)} className="px-3 py-1 bg-success/20 text-success text-xs font-bold rounded-pill hover:bg-success/30 transition-colors">Release</button>}</div> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-white text-xl font-black">Payments</h1>
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Collected" value={formatUGX(total)} icon={<span />} />
        <StatCard title="In Escrow" value={formatUGX(held)} icon={<span />} iconBg="bg-warning/20" iconColor="text-warning" />
        <StatCard title="Released" value={formatUGX(released)} icon={<span />} iconBg="bg-success/20" iconColor="text-success" />
        <StatCard title="Platform Revenue" value={formatUGX(total * 0.1)} icon={<span />} valueClass="text-primary" />
      </div>
      <DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payments found" />
    </div>
  );
};

export default PaymentsPage;
