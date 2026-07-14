import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../../stores/noteStore';
import NoteCard from '../notes/NoteCard';

export default function RecentNotes() {
  const navigate = useNavigate();
  const allNotes = useNoteStore(s => s.notes);

  const notes = useMemo(() =>
    allNotes.filter(n => !n.trashedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [allNotes]
  );

  if (notes.length === 0) return null;

  return (
    <div className="recent-notes">
      <div className="recent-notes-header">
        <span className="recent-notes-label">Recent Notes</span>
        <button className="recent-notes-more" onClick={() => navigate('/notes')}>
          View all →
        </button>
      </div>
      <div className="recent-notes-grid">
        {notes.map(note => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
