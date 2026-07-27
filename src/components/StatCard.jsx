const StatCard = ({ icon, title, value, trend, trendUp = true, iconBg = 'bg-primary/20', iconColor = 'text-primary', valueClass = 'text-white' }) => (
  <div className="bg-bg-card border border-border rounded-card p-5 shadow-card hover:border-primary/30 transition-colors duration-200">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-4 ${iconBg} ${iconColor}`}>
      {icon}
    </div>
    <div className={`text-3xl font-black mt-1 ${valueClass}`}>{value}</div>
    <div className="text-muted text-sm mt-1">{title}</div>
    {trend && (
      <div className={`${trendUp ? 'text-success' : 'text-danger'} text-xs mt-2 flex items-center gap-1`}>
        <span>{trendUp ? '↑' : '↓'}</span>
        <span>{trend}</span>
      </div>
    )}
  </div>
);

export default StatCard;
