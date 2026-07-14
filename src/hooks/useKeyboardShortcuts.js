import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const addNote = useNoteStore(s => s.addNote);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          toggleCommandPalette();
          break;
        case 'n':
          e.preventDefault();
          const note = addNote();
          navigate(`/notes/${note.id}`);
          break;
        case '\\':
          e.preventDefault();
          toggleSidebar();
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleCommandPalette, toggleSidebar, addNote]);
}
