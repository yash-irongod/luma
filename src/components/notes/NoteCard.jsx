import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { formatRelativeDate } from '../../utils/dates';
import './NoteCard.css';

export default function NoteCard({ note, compact = false }) {
  const navigate = useNavigate();
  const project = useProjectStore(s => s.projects.find(p => p.id === note.projectId));

  return (
    <article className={`note-card ${compact ? 'note-card-compact' : ''}`} onClick={() => navigate(`/notes/${note.id}`)}>
      <h3 className="note-card-title">{note.title || 'Untitled'}</h3>
      {note.excerpt && <p className="note-card-excerpt">{note.excerpt}</p>}
      <div className="note-card-meta">
        {project && (
          <span className="note-card-project">
            <span className="note-card-project-dot" style={{ background: project.color }} />
            {project.name}
          </span>
        )}
        <span className="note-card-date">{formatRelativeDate(note.updatedAt)}</span>
      </div>
    </article>
  );
}
