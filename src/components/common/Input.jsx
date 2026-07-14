import './Input.css';

export default function Input({
  icon: Icon, placeholder, value, onChange,
  type = 'text', className = '', autoFocus, ...props
}) {
  return (
    <div className={`input-wrapper ${className}`}>
      {Icon && <Icon size={16} className="input-icon" />}
      <input
        type={type}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        {...props}
      />
    </div>
  );
}
