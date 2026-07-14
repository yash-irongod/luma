import { useState, useMemo } from 'react';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { Trash2, FileText, CheckSquare, FolderOpen, RotateCcw, X } from 'lucide-react';
import { formatRelativeDate } from '../utils/dates';
import './TrashPage.css';

export default function TrashPage() {
  const allNotes = useNoteStore(s => s.notes);
  const allTasks = useTaskStore(s => s.tasks);
  const allProjectsRaw = useProjectStore(s => s.projects);

  const trashedNotes = useMemo(() => allNotes.filter(n => n.trashedAt), [allNotes]);
  const trashedTasks = useMemo(() => allTasks.filter(t => t.trashedAt), [allTasks]);
  const trashedProjects = useMemo(() => allProjectsRaw.filter(p => p.trashedAt), [allProjectsRaw]);

  const restoreNote = useNoteStore(s => s.restoreNote);
  const deleteNote = useNoteStore(s => s.deleteNote);
  const restoreTask = useTaskStore(s => s.restoreTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const restoreProject = useProjectStore(s => s.restoreProject);
  const deleteProject = useProjectStore(s => s.deleteProject);

  const [emptyConfirm, setEmptyConfirm] = useState(false);

  const allItems = useMemo(() => [
    ...trashedNotes.map(n => ({ ...n, type: 'note', icon: FileText })),
    ...trashedTasks.map(t => ({ ...t, type: 'task', icon: CheckSquare })),
    ...trashedProjects.map(p => ({ ...p, type: 'project', icon: FolderOpen, title: p.name })),
  ].sort((a, b) => b.trashedAt - a.trashedAt), [trashedNotes, trashedTasks, trashedProjects]);

  const handleRestore = (item) => {
    if (item.type === 'note') restoreNote(item.id);
    else if (item.type === 'task') restoreTask(item.id);
    else restoreProject(item.id);
  };

  const handleDelete = (item) => {
    if (item.type === 'note') deleteNote(item.id);
    else if (item.type === 'task') deleteTask(item.id);
    else deleteProject(item.id);
  };

  const handleEmptyTrash = () => {
    trashedNotes.forEach(n => deleteNote(n.id));
    trashedTasks.forEach(t => deleteTask(t.id));
    trashedProjects.forEach(p => deleteProject(p.id));
  };

  return (
    <>
      <TopBar title="Trash">
        {allItems.length > 0 && (
          <Button variant="danger" size="sm" onClick={() => setEmptyConfirm(true)}>
            Empty Trash
          </Button>
        )}
      </TopBar>
      <PageContainer>
        {allItems.length === 0 ? (
          <EmptyState
            icon={Trash2}
            heading="Trash is empty"
            body="Deleted items appear here for safekeeping."
          />
        ) : (
          <div className="trash-list">
            {allItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={`${item.type}-${item.id}`} className="trash-item">
                  <Icon size={16} className="trash-item-icon" />
                  <span className="trash-item-title">{item.title || item.name || 'Untitled'}</span>
                  <span className="trash-item-type">{item.type}</span>
                  <span className="trash-item-date">{formatRelativeDate(item.trashedAt)}</span>
                  <div className="trash-item-actions">
                    <button className="icon-btn" onClick={() => handleRestore(item)} aria-label="Restore" title="Restore">
                      <RotateCcw size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(item)} aria-label="Delete permanently" title="Delete permanently">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        isOpen={emptyConfirm}
        onClose={() => setEmptyConfirm(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash"
        message="This will permanently delete all items in the trash. This action cannot be undone."
        confirmLabel="Empty Trash"
      />
    </>
  );
}
