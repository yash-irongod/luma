import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../../stores/noteStore';
import { useTaskStore } from '../../stores/taskStore';
import './ProjectCard.css';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const allNotes = useNoteStore(s => s.notes);
  const allTasks = useTaskStore(s => s.tasks);
  const noteCount = useMemo(() => allNotes.filter(n => !n.trashedAt && n.projectId === project.id).length, [allNotes, project.id]);
  const taskCount = useMemo(() => allTasks.filter(t => !t.trashedAt && !t.completed && t.projectId === project.id).length, [allTasks, project.id]);

  return (
    <article
      className="project-card"
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{ '--project-color': project.color }}
    >
      <span className="project-card-emoji">{project.emoji}</span>
      <h3 className="project-card-name">{project.name}</h3>
      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}
      <div className="project-card-stats">
        <span>{noteCount} notes</span>
        <span>·</span>
        <span>{taskCount} tasks</span>
      </div>
    </article>
  );
}
