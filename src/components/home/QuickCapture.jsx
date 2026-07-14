import { Search, Sparkles } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import './QuickCapture.css';

export default function QuickCapture() {
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette);

  return (
    <button className="quick-capture" onClick={toggleCommandPalette}>
      <Sparkles size={16} className="quick-capture-icon" />
      <span className="quick-capture-text">Capture a thought...</span>
      <kbd className="quick-capture-kbd">⌘K</kbd>
    </button>
  );
}
