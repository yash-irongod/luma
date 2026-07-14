import './Button.css';

export default function Button({
  children, variant = 'secondary', size = 'md',
  icon: Icon, onClick, disabled, className = '', ...props
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children && <span>{children}</span>}
    </button>
  );
}
