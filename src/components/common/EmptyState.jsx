import './EmptyState.css';

export default function EmptyState({ icon: Icon, heading, body, action, onAction }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={40} strokeWidth={1.2} />
        </div>
      )}
      <h3 className="empty-state-heading">{heading}</h3>
      {body && <p className="empty-state-body">{body}</p>}
      {action && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
