const StatCard = ({ icon, title, value, trend, trendUp = true, iconBg = 'bg-primary/20', iconColor = 'text-primary', valueClass = 'text-white' }) => (
  <div className="bg-bg-card border border-border rounded-card p-4 shadow-card hover:border-primary/30 transition-colors duration-200">
    <div className="flex items-center justify-between gap-3">
      <div className="text-muted text-xs font-bold uppercase tracking-wider">{title}</div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    </div>
    <div className={`text-2xl font-black mt-1.5 leading-tight break-words ${valueClass}`}>{value}</div>
    {trend && (
      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-bold ${trendUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
        <span>{trendUp ? '↑' : '↓'}</span>
        <span>{trend}</span>
      </div>
    )}
  </div>
);

export default StatCard;
