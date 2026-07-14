export default function IconButton({ icon: Icon, onClick, size = 16, label, className = '', ...props }) {
  return (
    <button
      className={`icon-btn ${className}`}
      onClick={onClick}
      aria-label={label}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}
