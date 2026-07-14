import './TagPill.css';

export default function TagPill({ name, color, onRemove }) {
  return (
    <span className="tag-pill" style={{ '--tag-color': color }}>
      <span className="tag-pill-dot" />
      <span className="tag-pill-name">{name}</span>
      {onRemove && (
        <button className="tag-pill-remove" onClick={onRemove} aria-label={`Remove tag ${name}`}>
          ×
        </button>
      )}
    </span>
  );
}
