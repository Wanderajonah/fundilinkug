import { useCallback, useEffect, useState } from 'react';
import { RiCheckDoubleLine, RiCloseCircleLine, RiShieldCheckLine, RiInformationLine } from 'react-icons/ri';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api';
import { formatDate, readList } from '../utils/format';

const iconMap = {
  verification_approved: RiShieldCheckLine,
  verification_rejected: RiCloseCircleLine,
  info: RiInformationLine,
};

const colorMap = {
  verification_approved: 'text-success',
  verification_rejected: 'text-danger',
  info: 'text-info',
};

const bgMap = {
  verification_approved: 'bg-success/10',
  verification_rejected: 'bg-danger/10',
  info: 'bg-info/10',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(readList(res.data, ['notifications', 'data']));
      setUnread(res.data.unread || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-black">Notifications</h1>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-pill hover:bg-primary/30 transition-colors">
            <RiCheckDoubleLine /> Mark all read
          </button>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-bg-card border border-border rounded-card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-bg-raised" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-bg-raised rounded w-3/4" />
                <div className="h-3 bg-bg-raised rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-card p-10 text-center text-muted text-sm">No notifications yet</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.type] || RiInformationLine;
            return (
              <div
                key={n._id}
                className={`bg-bg-card border border-border rounded-card p-4 flex items-start gap-3 transition-colors ${!n.read ? 'border-l-2 border-l-primary' : ''} ${!n.read ? 'cursor-pointer' : ''}`}
                onClick={() => !n.read && handleMarkRead(n._id)}
              >
                <div className={`w-10 h-10 rounded-full ${bgMap[n.type] || 'bg-bg-raised'} flex items-center justify-center shrink-0`}>
                  <Icon className={`text-lg ${colorMap[n.type] || 'text-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{n.message}</p>
                  <p className="text-muted text-xs mt-1">{formatDate(n.createdAt)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
