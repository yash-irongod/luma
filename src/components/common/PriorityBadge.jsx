import { PRIORITIES } from '../../utils/constants';
import './PriorityBadge.css';

export default function PriorityBadge({ priority, showLabel = false }) {
  const p = PRIORITIES.find(pr => pr.value === priority) || PRIORITIES[0];
  return (
    <span className="priority-badge" title={p.label}>
      <span className="priority-dot" style={{ background: p.color }} />
      {showLabel && <span className="priority-label">{p.label}</span>}
    </span>
  );
}
