import { useEffect, useState } from 'react';
import { RiEyeLine } from 'react-icons/ri';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { getPayments, releaseEscrow } from '../services/api';
import { formatDate, formatUGX, readList, toastMessage } from '../utils/format';

const RELEVANT_TYPES = ['escrow_hold', 'escrow_release', 'escrow_refund', 'payment_received', 'platform_fee'];

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments();
      const all = readList(res.data, ['payments', 'data']);
      setPayments(all.filter((t) => RELEVANT_TYPES.includes(t.type)).map(normalizePayment));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const normalizePayment = (t) => {
    const isEscrow = t.type === 'escrow_hold' || t.type === 'escrow_release' || t.type === 'escrow_refund';
    const escrowStatus = t.type === 'escrow_release' ? 'released' : t.type === 'escrow_refund' ? 'refunded' : isEscrow ? 'held' : 'none';
    const fundiName = t.type === 'payment_received' ? t.userId?.name || t.relatedUser?.name || 'Fundi' : '—';
    return {
      ...t,
      payId: t._id?.slice(-8),
      bookingId: t.relatedBooking || 'N/A',
      fundi: { name: fundiName },
      method: t.paymentMethod || (isEscrow ? 'Escrow' : 'Wallet'),
      escrow: escrowStatus,
      label: t.type === 'escrow_release' ? 'Released to fundi'
        : t.type === 'escrow_hold' ? 'Escrow hold'
        : t.type === 'escrow_refund' ? 'Refunded to client'
        : t.type === 'payment_received' ? 'Paid to fundi'
        : t.type === 'platform_fee' ? 'Platform commission'
        : t.type,
    };
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const paidToFundis = payments
    .filter((p) => p.type === 'escrow_release' || p.type === 'payment_received')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const escrowHeld = payments
    .filter((p) => p.type === 'escrow_hold')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    - payments.filter((p) => p.type === 'escrow_release').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    - payments.filter((p) => p.type === 'escrow_refund').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const commissionEarned = payments
    .filter((p) => p.type === 'platform_fee')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleRelease = async (payment) => {
    if (!window.confirm('Release escrow for this payment?')) return;
    try {
      await releaseEscrow(payment.relatedBooking || payment._id);
      toastMessage('Escrow released.');
      loadPayments();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to release escrow.');
    }
  };

  const columns = [
    { key: 'label', header: 'Type', render: (p) => <span className="text-white text-sm">{p.label}</span> },
    { key: 'bookingId', header: 'Booking', render: (p) => <span className="text-muted text-xs">{p.bookingId}</span> },
    { key: 'fundi', header: 'Fundi', render: (p) => p.fundi?.name || '—' },
    { key: 'amount', header: 'Amount', render: (p) => formatUGX(p.amount) },
    { key: 'escrow', header: 'Escrow', render: (p) => p.escrow !== 'none' ? <Badge label={p.escrow} type={p.escrow === 'released' ? 'success' : p.escrow === 'refunded' ? 'info' : 'warning'} /> : <span className="text-muted text-xs">—</span> },
    { key: 'date', header: 'Date', render: (p) => formatDate(p.createdAt) },
    { key: 'actions', header: 'Actions', render: (p) => <div className="flex items-center gap-2">{p.escrow === 'held' && <button onClick={() => handleRelease(p)} className="px-3 py-1 bg-success/20 text-success text-xs font-bold rounded-pill hover:bg-success/30 transition-colors">Release</button>}</div> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-white text-xl font-black">Payments</h1>
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Paid to Fundis" value={formatUGX(paidToFundis)} icon={<span />} iconBg="bg-success/20" iconColor="text-success" />
        <StatCard title="Held in Escrow" value={formatUGX(Math.max(0, escrowHeld))} icon={<span />} iconBg="bg-warning/20" iconColor="text-warning" />
        <StatCard title="Commission Earned" value={formatUGX(commissionEarned)} icon={<span />} iconBg="bg-primary/20" iconColor="text-primary" valueClass="text-primary" />
      </div>
      <DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payment transactions found" />
    </div>
  );
};

export default PaymentsPage;
