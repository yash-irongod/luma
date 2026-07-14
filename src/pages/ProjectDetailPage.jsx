import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import NoteCard from '../components/notes/NoteCard';
import TaskInput from '../components/tasks/TaskInput';
import TaskItem from '../components/tasks/TaskItem';
import ProjectForm from '../components/projects/ProjectForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useProjectStore } from '../stores/projectStore';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { Inbox, Plus, Pencil } from 'lucide-react';
import './ProjectDetailPage.css';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = useProjectStore(s => s.projects.find(p => p.id === id));
  const allNotes = useNoteStore(s => s.notes);
  const allTasks = useTaskStore(s => s.tasks);
  const addNote = useNoteStore(s => s.addNote);
  const [showEdit, setShowEdit] = useState(false);

  const notes = useMemo(() =>
    allNotes.filter(n => !n.trashedAt && n.projectId === id).sort((a, b) => b.updatedAt - a.updatedAt),
    [allNotes, id]
  );
  const tasks = useMemo(() => allTasks.filter(t => !t.trashedAt && t.projectId === id), [allTasks, id]);
  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  if (!project) {
    return <PageContainer><p style={{ color: 'var(--luma-text-tertiary)', textAlign: 'center', padding: 'var(--luma-space-16)' }}>Project not found.</p></PageContainer>;
  }

  const handleNewNote = () => {
    const note = addNote({ projectId: id });
    navigate(`/notes/${note.id}`);
  };

  return (
    <>
      <TopBar backTo="/projects" backLabel="Projects">
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setShowEdit(true)}>Edit</Button>
      </TopBar>
      <PageContainer>
        <div className="project-detail">
          <div className="project-detail-header">
            <span className="project-detail-emoji">{project.emoji}</span>
            <h1 className="project-detail-name">{project.name}</h1>
            {project.description && <p className="project-detail-desc">{project.description}</p>}
          </div>

          {notes.length === 0 && tasks.length === 0 ? (
            <EmptyState
              icon={Inbox}
              heading="This project is empty"
              body="Start adding notes or tasks to bring it to life."
              action="New note"
              onAction={handleNewNote}
            />
          ) : (
            <>
              <section className="project-section">
                <div className="project-section-header">
                  <h2 className="project-section-title">Notes</h2>
                  <Button variant="ghost" size="sm" icon={Plus} onClick={handleNewNote}>Add</Button>
                </div>
                {notes.length > 0 ? (
                  <div className="project-notes-grid">{notes.map(n => <NoteCard key={n.id} note={n} />)}</div>
                ) : (
                  <p className="project-section-empty">No notes yet.</p>
                )}
              </section>

              <section className="project-section">
                <h2 className="project-section-title">Tasks</h2>
                <TaskInput projectId={id} />
                {activeTasks.map(t => <TaskItem key={t.id} task={t} />)}
                {completedTasks.length > 0 && (
                  <details className="project-completed">
                    <summary className="project-completed-summary">
                      {completedTasks.length} completed
                    </summary>
                    {completedTasks.map(t => <TaskItem key={t.id} task={t} />)}
                  </details>
                )}
              </section>
            </>
          )}
        </div>
      </PageContainer>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <ProjectForm project={project} onClose={() => setShowEdit(false)} />
      </Modal>
    </>
  );
}
