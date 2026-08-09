const STATUS_LABELS = {
  open: 'Pending',
  quoted: 'Quoted',
  accepted: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ACTIVE_STATUSES = new Set(['open', 'quoted', 'accepted', 'in_progress']);

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function mapJobToListItem(job, userRole) {
  if (!job) return null;
  const isFundi = userRole === 'fundi';
  const customer = job.customerId || {};
  const fundi = job.fundiId || {};
  const amount = job.quoteAmount || job.amount || 0;
  const status = job.status || 'open';

  return {
    id: job._id || job.id,
    jobId: job._id || job.id,
    name: isFundi ? customer.name || 'Client' : fundi.name || 'Fundi',
    customerName: customer.name || 'Client',
    fundiName: fundi.name || 'Fundi',
    service: job.category || 'Service',
    description: job.description || '',
    address: job.address || '',
    amount,
    status,
    statusLabel: STATUS_LABELS[status] || status,
    time: formatJobTime(job.updatedAt || job.createdAt),
    rating: 0,
    action:
      status === 'in_progress'
        ? 'Complete Job'
        : status === 'accepted'
          ? 'Start Job'
          : status === 'open'
            ? 'Review Request'
            : 'Message',
    raw: job,
  };
}

export function formatJobTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-UG', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function partitionJobs(jobs = [], userRole) {
  const items = jobs.map((j) => mapJobToListItem(j, userRole));
  return {
    active: items.filter((j) => ACTIVE_STATUSES.has(j.status)),
    completed: items.filter((j) => j.status === 'completed'),
    cancelled: items.filter((j) => j.status === 'cancelled'),
  };
}

export function computeEarnings(jobs = []) {
  const completed = jobs.filter((j) => j.status === 'completed');
  const amountOf = (j) => j.quoteAmount || j.amount || 0;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const filterBy = (from) => (j) => new Date(j.updatedAt || j.createdAt) >= from;

  const today = completed
    .filter(filterBy(startOfDay))
    .reduce((sum, j) => sum + amountOf(j), 0);

  const week = completed
    .filter(filterBy(startOfWeek))
    .reduce((sum, j) => sum + amountOf(j), 0);

  const month = completed
    .filter(filterBy(startOfMonth))
    .reduce((sum, j) => sum + amountOf(j), 0);

  return { today, week, month };
}

export function findPendingJobRequest(jobs = [], fundiUserId) {
  return jobs.find((j) => {
    const assigned =
      j.fundiId && String(j.fundiId._id || j.fundiId) === String(fundiUserId);
    return assigned && (j.status === 'open' || j.status === 'quoted');
  });
}

export function mapJobRequest(job) {
  if (!job) return null;
  const customer = job.customerId || {};
  return {
    id: job._id,
    customerName: customer.name || 'Client',
    service: job.category || 'Service',
    address: job.address || '',
    distanceKm: job.distanceKm,
    scheduledAt: formatJobTime(job.createdAt),
    estimatedAmount: job.quoteAmount || job.amount || 0,
    raw: job,
  };
}

export function mapJobToScheduleItem(job) {
  const customer = job.customerId || {};
  const d = new Date(job.updatedAt || job.createdAt);
  return {
    id: job._id,
    time: d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }),
    title: `${job.category || 'Service'} - ${customer.name || 'Client'}`,
    status: STATUS_LABELS[job.status] || job.status,
    statusKey: job.status,
  };
}
