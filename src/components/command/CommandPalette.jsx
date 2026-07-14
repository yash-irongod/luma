import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { useProjectStore } from '../../stores/projectStore';
import { FileText, CheckSquare, FolderOpen, Home, Search, Settings, Plus, Trash2 } from 'lucide-react';
import './CommandPalette.css';

export default function CommandPalette() {
  const open = useUIStore(s => s.commandPaletteOpen);
  const closeCommandPalette = useUIStore(s => s.closeCommandPalette);
  const navigate = useNavigate();
  const addNote = useNoteStore(s => s.addNote);
  const allNotes = useNoteStore(s => s.notes);
  const allProjects = useProjectStore(s => s.projects);

  const recentNotes = useMemo(() =>
    allNotes.filter(n => !n.trashedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [allNotes]
  );
  const projects = useMemo(() => allProjects.filter(p => !p.trashedAt), [allProjects]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') closeCommandPalette(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, closeCommandPalette]);

  const go = (path) => { navigate(path); closeCommandPalette(); };

  const createNote = () => {
    const note = addNote();
    go(`/notes/${note.id}`);
  };

  if (!open) return null;

  return (
    <div className="command-overlay" onClick={closeCommandPalette}>
      <div className="command-wrapper" onClick={e => e.stopPropagation()}>
        <Command label="Command Menu" className="command-dialog">
          <Command.Input placeholder="Search or type a command..." className="command-input" autoFocus />
          <Command.List className="command-list">
            <Command.Empty className="command-empty">No results found.</Command.Empty>

            <Command.Group heading="Quick Actions" className="command-group">
              <Command.Item className="command-item" onSelect={createNote}>
                <Plus size={16} /> New Note
              </Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/tasks')}>
                <CheckSquare size={16} /> New Task
              </Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/projects')}>
                <FolderOpen size={16} /> New Project
              </Command.Item>
            </Command.Group>

            {recentNotes.length > 0 && (
              <Command.Group heading="Recent Notes" className="command-group">
                {recentNotes.map(note => (
                  <Command.Item
                    key={note.id}
                    className="command-item"
                    onSelect={() => go(`/notes/${note.id}`)}
                    value={note.title || 'Untitled'}
                  >
                    <FileText size={16} />
                    <span className="command-item-title">{note.title || 'Untitled'}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {projects.length > 0 && (
              <Command.Group heading="Projects" className="command-group">
                {projects.map(p => (
                  <Command.Item
                    key={p.id}
                    className="command-item"
                    onSelect={() => go(`/projects/${p.id}`)}
                    value={p.name}
                  >
                    <span style={{ fontSize: '16px' }}>{p.emoji}</span>
                    <span className="command-item-title">{p.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation" className="command-group">
              <Command.Item className="command-item" onSelect={() => go('/')}><Home size={16} /> Home</Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/notes')}><FileText size={16} /> Notes</Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/tasks')}><CheckSquare size={16} /> Tasks</Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/projects')}><FolderOpen size={16} /> Projects</Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/search')}><Search size={16} /> Search</Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/trash')}><Trash2 size={16} /> Trash</Command.Item>
              <Command.Item className="command-item" onSelect={() => go('/settings')}><Settings size={16} /> Settings</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
