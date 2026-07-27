export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

export function ratingLabel(stars) {
  return RATING_LABELS[stars] || '';
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatUgx(amount) {
  return `UGX ${Number(amount || 0).toLocaleString('en-UG')}`;
}

export function formatShortTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' });
}

export function formatBookingDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-UG', { month: 'long', day: 'numeric' });
}

export const DEMO_PAST_BOOKINGS = [];

export function buildBookingFromRequest(request, artisan = {}) {
  if (!request) request = {};
  const serviceFee = 16000;
  const platformFee = 1600;
  const total = serviceFee + platformFee;
  const name = artisan.name || 'Fundi';
  return {
    service: request.service || 'Service',
    date: request.date || 'Today',
    time: request.time || '',
    location: request.location || '',
    address: request.location || '',
    artisanName: name,
    artisan,
    fundiId: artisan.id || artisan._id,
    serviceFee,
    platformFee,
    total,
    amount: total,
    eta: 8,
  };
}

export function defaultActiveJob(booking = {}, artisan = {}) {
  const name = artisan.name || booking.artisanName || 'Fundi';
  return {
    id: booking.jobId || booking.id,
    fundiId: artisan.id || artisan._id || booking.fundiId,
    fundiName: name,
    service: booking.service || 'Service',
    address: booking.address || booking.location || '',
    amount: booking.total || booking.amount || 0,
    elapsedMins: booking.elapsedMins || 0,
    status: booking.status || 'in_progress',
    startedAt: booking.startedAt || Date.now(),
  };
}
