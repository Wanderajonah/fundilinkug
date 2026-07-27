import { useEffect, useState } from 'react';
import { RiDeleteBinLine, RiEyeLine, RiStarFill, RiStarLine } from 'react-icons/ri';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { deleteReview, getReviews } from '../services/api';
import { formatDate, readList, toastMessage } from '../utils/format';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [selected, setSelected] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getReviews({ rating: rating === 'All' ? undefined : rating, sort });
      setReviews(readList(res.data, ['reviews', 'data']));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [rating, sort]);

  const filtered = reviews.filter((review) => rating === 'All' || Number(review.rating || review.stars) === Number(rating));
  const stars = (value) => <div className="text-primary text-sm flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => (index < Number(value || 0) ? <RiStarFill key={index} /> : <RiStarLine key={index} />))}</div>;

  const handleDelete = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(review.id || review._id);
      toastMessage('Review deleted.');
      loadReviews();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to delete review.');
    }
  };

  const columns = [
    { key: 'index', header: '#', render: (_, index) => index + 1 },
    { key: 'client', header: 'Client', render: (r) => r.client?.name || r.clientName || 'N/A' },
    { key: 'fundi', header: 'Fundi', render: (r) => r.fundi?.name || r.fundiName || 'N/A' },
    { key: 'stars', header: 'Stars', render: (r) => stars(r.rating || r.stars) },
    { key: 'comment', header: 'Comment', render: (r) => <span className="text-muted text-sm">{(r.comment || '').length > 60 ? `${r.comment.slice(0, 60)}...` : r.comment || 'No comment'}</span> },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.createdAt || r.date) },
    { key: 'actions', header: 'Actions', render: (r) => <div className="flex gap-1"><button onClick={() => setSelected(r)} className="p-1.5 text-muted hover:text-info transition-colors" aria-label="View review"><RiEyeLine /></button><button onClick={() => handleDelete(r)} className="p-1.5 text-muted hover:text-danger transition-colors" aria-label="Delete review"><RiDeleteBinLine /></button></div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-white text-xl font-black">Reviews</h1><span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-pill">{filtered.length} Reviews</span></div>
      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{error}</div>}
      <div className="flex items-center gap-3 flex-wrap"><select value={rating} onChange={(event) => setRating(event.target.value)} className="bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none focus:border-primary cursor-pointer">{['All', '5', '4', '3', '2', '1'].map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none focus:border-primary cursor-pointer">{['Newest', 'Oldest', 'Highest', 'Lowest'].map((item) => <option key={item}>{item}</option>)}</select></div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No reviews found" />
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review" size="md">{selected && <div className="space-y-4"><div>{stars(selected.rating || selected.stars)}</div><p className="text-white text-sm leading-6">{selected.comment || 'No comment.'}</p><div className="text-muted text-xs">{selected.client?.name || selected.clientName} reviewed {selected.fundi?.name || selected.fundiName} on {formatDate(selected.createdAt || selected.date)}</div></div>}</Modal>
    </div>
  );
};

export default ReviewsPage;
