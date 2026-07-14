import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TaskItem from '../components/tasks/TaskItem';
import EmptyState from '../components/common/EmptyState';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { getGreeting, formatRelativeDate, isToday } from '../utils/dates';
import { format } from 'date-fns';
import { Sparkles, FileText, CheckSquare, FolderOpen, Sun, Plus, ArrowRight } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const userName = useUIStore(s => s.userName);
  const allNotes = useNoteStore(s => s.notes);
  const allTasks = useTaskStore(s => s.tasks);
  const addNote = useNoteStore(s => s.addNote);

  const notes = useMemo(() => allNotes.filter(n => !n.trashedAt), [allNotes]);
  const tasks = useMemo(() => allTasks.filter(t => !t.trashedAt), [allTasks]);
  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  const myDayTasks = useMemo(() => {
    return activeTasks
      .filter(t => t.focusToday || (t.dueDate && isToday(t.dueDate)))
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      });
  }, [activeTasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < today && !isToday(t.dueDate));
  }, [activeTasks]);

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 4);
  }, [notes]);

  const isEmpty = notes.length === 0 && tasks.length === 0;
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleNewNote = () => {
    const note = addNote();
    navigate(`/notes/${note.id}`);
  };

  return (
    <PageContainer>
      <div className="home-page">
        {/* Header */}
        <div className="home-header">
          <div>
            <h1 className="home-greeting">{getGreeting()}{userName ? `, ${userName}` : ''}</h1>
            <p className="home-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {isEmpty ? (
          <EmptyState
            icon={Sparkles}
            heading="Welcome to Luma"
            body="Your productivity workspace. Start by creating a note or adding a task."
            action="Create a note"
            onAction={handleNewNote}
          />
        ) : (
          <>
            {/* Overdue alert */}
            {overdueTasks.length > 0 && (
              <div className="home-alert">
                <span className="home-alert-dot" />
                <span>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span>
                <Link to="/tasks" className="home-alert-link">View →</Link>
              </div>
            )}

            {/* My Day */}
            <section className="home-section">
              <div className="home-section-header">
                <div className="home-section-title">
                  <Sun size={16} className="home-section-icon" style={{ color: 'var(--luma-warning)' }} />
                  <h2>My Day</h2>
                  <span className="home-section-count">{myDayTasks.length}</span>
                </div>
                <Link to="/tasks?list=my-day" className="home-section-link">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {myDayTasks.length === 0 ? (
                <p className="home-section-empty">No tasks for today. Add tasks and mark them as "My Day" to plan your focus.</p>
              ) : (
                <div className="home-task-list">
                  <AnimatePresence>
                    {myDayTasks.slice(0, 5).map(task => (
                      <TaskItem key={task.id} task={task} compact />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Recent Notes */}
            {recentNotes.length > 0 && (
              <section className="home-section">
                <div className="home-section-header">
                  <div className="home-section-title">
                    <FileText size={16} className="home-section-icon" />
                    <h2>Recent Notes</h2>
                  </div>
                  <Link to="/notes" className="home-section-link">
                    View all <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="home-notes-grid">
                  {recentNotes.map(note => (
                    <Link key={note.id} to={`/notes/${note.id}`} className="home-note-card">
                      <span className="home-note-title">{note.title || 'Untitled'}</span>
                      <span className="home-note-excerpt">{note.excerpt || 'No content'}</span>
                      <span className="home-note-time">{formatRelativeDate(note.updatedAt)}</span>
                    </Link>
                  ))}
                  <button className="home-note-card home-note-add" onClick={handleNewNote}>
                    <Plus size={20} />
                    <span>New note</span>
                  </button>
                </div>
              </section>
            )}

            {/* Stats bar */}
            <section className="home-stats">
              <div className="home-stat">
                <FileText size={16} />
                <span className="home-stat-value">{notes.length}</span>
                <span className="home-stat-label">notes</span>
              </div>
              <div className="home-stat">
                <CheckSquare size={16} />
                <span className="home-stat-value">{completedCount}/{totalTasks}</span>
                <span className="home-stat-label">tasks done</span>
              </div>
              <div className="home-stat-progress">
                <div className="home-stat-bar">
                  <div className="home-stat-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="home-stat-percent">{progressPercent}%</span>
              </div>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
