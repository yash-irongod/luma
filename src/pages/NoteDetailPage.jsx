import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import PageContainer from '../components/layout/PageContainer';
import NoteEditor from '../components/notes/NoteEditor';
import { useNoteStore } from '../stores/noteStore';
import { useProjectStore } from '../stores/projectStore';
import Dropdown, { DropdownItem } from '../components/common/Dropdown';
import { Pin, Trash2, FolderOpen, MoreHorizontal } from 'lucide-react';

export default function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const note = useNoteStore(s => s.notes.find(n => n.id === id));
  const updateNote = useNoteStore(s => s.updateNote);
  const trashNote = useNoteStore(s => s.trashNote);
  const togglePin = useNoteStore(s => s.togglePin);
  const allProjects = useProjectStore(s => s.projects);
  const projects = useMemo(() => allProjects.filter(p => !p.trashedAt), [allProjects]);
  const [title, setTitle] = useState(note?.title || '');

  // Sync title when navigating between notes
  useEffect(() => {
    setTitle(note?.title || '');
  }, [id, note?.title]);

  if (!note) {
    return (
      <PageContainer>
        <div className="empty-state">
          <p style={{ color: 'var(--luma-text-tertiary)', textAlign: 'center', padding: 'var(--luma-space-16)' }}>
            Note not found.
          </p>
        </div>
      </PageContainer>
    );
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    updateNote(note.id, { title: e.target.value });
  };

  const handleTrash = () => {
    trashNote(note.id);
    navigate('/notes');
  };

  const currentProject = projects.find(p => p.id === note.projectId);

  return (
    <>
      <TopBar backTo="/notes" backLabel="Notes">
        <Dropdown
          align="right"
          trigger={
            <button className="icon-btn" aria-label="Assign to project" title={currentProject ? currentProject.name : 'Assign to project'}>
              <FolderOpen size={16} style={currentProject ? { color: currentProject.color } : undefined} />
            </button>
          }
        >
          <DropdownItem onClick={() => updateNote(note.id, { projectId: null })}>
            No project
          </DropdownItem>
          {projects.map(p => (
            <DropdownItem key={p.id} onClick={() => updateNote(note.id, { projectId: p.id })}>
              {p.emoji} {p.name}
            </DropdownItem>
          ))}
        </Dropdown>

        <button className="icon-btn" onClick={() => togglePin(note.id)} aria-label="Pin note" title={note.isPinned ? 'Unpin' : 'Pin'}>
          <Pin size={16} style={note.isPinned ? { color: 'var(--luma-accent)' } : undefined} />
        </button>

        <Dropdown
          align="right"
          trigger={<button className="icon-btn" aria-label="More actions"><MoreHorizontal size={16} /></button>}
        >
          <DropdownItem danger onClick={handleTrash}>
            <Trash2 size={14} /> Move to Trash
          </DropdownItem>
        </Dropdown>
      </TopBar>

      <PageContainer>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <input
            className="note-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            autoFocus={!note.title}
          />
          <NoteEditor key={note.id} note={note} onUpdate={updateNote} />
        </div>
      </PageContainer>
    </>
  );
}
