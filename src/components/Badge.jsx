const styles = {
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
  info: 'bg-info/20 text-info',
  default: 'bg-white/10 text-muted',
};

const Badge = ({ label, type = 'default' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-bold ${styles[type] || styles.default}`}>
    {label}
  </span>
);

export default Badge;
