import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { admin } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-white text-xl font-black">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Admin Profile</h2>
          <div className="space-y-4">
            <div><label className="block text-muted text-xs font-bold uppercase tracking-wider mb-2">Name</label><input value={admin?.name || 'Admin User'} readOnly className="w-full bg-bg-raised border border-border rounded-input px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors duration-200 placeholder:text-muted" /></div>
            <div><label className="block text-muted text-xs font-bold uppercase tracking-wider mb-2">Email</label><input value={admin?.email || 'admin@fundilink.ug'} readOnly className="w-full bg-bg-raised border border-border rounded-input px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors duration-200 placeholder:text-muted" /></div>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
          <h2 className="text-white font-bold text-base mb-4">Platform Controls</h2>
          <div className="space-y-3">
            {['Manual fundi verification', 'Escrow release approval', 'Booking status notifications'].map((item) => <label key={item} className="flex items-center justify-between bg-bg-raised rounded-input p-3 text-white text-sm"><span>{item}</span><input type="checkbox" defaultChecked className="accent-primary" /></label>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
