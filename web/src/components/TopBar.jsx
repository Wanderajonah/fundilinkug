import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiNotification3Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';
import { getNotifications } from '../services/api';

const titles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/fundis': 'Fundis',
  '/admin/clients': 'Clients',
  '/admin/bookings': 'Bookings',
  '/admin/notifications': 'Notifications',
  '/admin/payments': 'Payments',
  '/admin/reviews': 'Reviews',
  '/admin/settings': 'Settings',
};

const TopBar = () => {
  const { pathname } = useLocation();
  const { admin } = useAuth();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await getNotifications({ limit: 1 });
      setUnread(res.data?.unread || 0);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <header className="fixed top-0 left-0 md:left-60 right-0 h-16 bg-[#111111] border-b border-border flex items-center justify-between px-6 z-40">
      <div className="text-white font-bold text-lg pl-10 md:pl-0">{titles[pathname] || 'Dashboard'}</div>
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search admin"
          className="hidden sm:block bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none w-56 focus:border-primary placeholder:text-muted transition-colors duration-200"
        />
        <Link to="/admin/notifications" className="relative p-2 text-muted hover:text-white transition-colors" aria-label="Notifications">
          <RiNotification3Line className="text-xl" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-primary-text text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unread}</span>
          )}
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-text font-black text-xs cursor-pointer">
          {getInitials(admin?.name || admin?.email)}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
