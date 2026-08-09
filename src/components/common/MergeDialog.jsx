import './MergeDialog.css';

export default function MergeDialog({ onMerge }) {
  return (
    <div className="merge-dialog-overlay">
      <div className="merge-dialog">
        <h2>Merge Data</h2>
        <p>Welcome back! We found data on both this device and your cloud account.</p>
        <div className="merge-actions">
          <button className="merge-btn primary" onClick={() => onMerge('merge')}>
            Merge Both
          </button>
          <button className="merge-btn secondary" onClick={() => onMerge('cloud')}>
            Use Cloud Data
          </button>
          <button className="merge-btn secondary" onClick={() => onMerge('local')}>
            Keep Local Data
          </button>
        </div>
      </div>
    </div>
  );
}
