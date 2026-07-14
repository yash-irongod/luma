import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ color: 'var(--luma-text-secondary)', fontSize: 'var(--luma-text-sm)', marginBottom: 'var(--luma-space-6)', lineHeight: 'var(--luma-leading-normal)' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 'var(--luma-space-3)', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
