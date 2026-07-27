import { useLocation } from 'react-router-dom';
import { RiNotification3Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

const titles = {
  '/dashboard': 'Dashboard',
  '/fundis': 'Fundis',
  '/clients': 'Clients',
  '/bookings': 'Bookings',
  '/payments': 'Payments',
  '/reviews': 'Reviews',
  '/settings': 'Settings',
};

const TopBar = () => {
  const { pathname } = useLocation();
  const { admin } = useAuth();

  return (
    <header className="fixed top-0 left-0 md:left-60 right-0 h-16 bg-[#111111] border-b border-border flex items-center justify-between px-6 z-40">
      <div className="text-white font-bold text-lg pl-10 md:pl-0">{titles[pathname] || 'Dashboard'}</div>
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search admin"
          className="hidden sm:block bg-bg-raised border border-border rounded-input px-4 py-2 text-white text-sm outline-none w-56 focus:border-primary placeholder:text-muted transition-colors duration-200"
        />
        <button type="button" className="relative p-2 text-muted hover:text-white transition-colors" aria-label="Notifications">
          <RiNotification3Line className="text-xl" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-text font-black text-xs cursor-pointer">
          {getInitials(admin?.name || admin?.email)}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
