import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import TaskInput from '../components/tasks/TaskInput';
import TaskGroup from '../components/tasks/TaskGroup';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { useTaskStore } from '../stores/taskStore';
import { useListStore } from '../stores/listStore';
import { CircleCheck, Sun, ListFilter, ArrowUpDown } from 'lucide-react';
import { isToday, isOverdue, isFuture, getTodayISO } from '../utils/dates';
import './TasksPage.css';

const VIEWS = [
  { id: 'my-day', label: 'My Day', icon: Sun },
  { id: 'all', label: 'All Tasks', icon: ListFilter },
  { id: 'priority', label: 'By Priority', icon: ArrowUpDown },
  { id: 'date', label: 'By Date', icon: ListFilter },
];

const SORT_OPTIONS = [
  { id: 'priority', label: 'Priority' },
  { id: 'date', label: 'Due date' },
  { id: 'alpha', label: 'Alphabetical' },
  { id: 'created', label: 'Created' },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const listParam = searchParams.get('list');
  const isMyDayRoute = listParam === 'my-day';
  const listFilter = isMyDayRoute ? null : listParam;

  const [view, setView] = useState(isMyDayRoute ? 'my-day' : 'all');
  const [sortBy, setSortBy] = useState('priority');
  const [showCompleted, setShowCompleted] = useState(false);

  // Sync view when navigating via sidebar (URL params change)
  useEffect(() => {
    if (isMyDayRoute) {
      setView('my-day');
    } else if (listFilter) {
      setView('all'); // When viewing a specific list, show all tasks in it
    }
  }, [isMyDayRoute, listFilter]);

  const allTasks = useTaskStore(s => s.tasks);
  const allLists = useListStore(s => s.lists);

  // Base filter: not trashed, optional list filter
  const tasks = useMemo(() => {
    let filtered = allTasks.filter(t => !t.trashedAt);
    if (listFilter) {
      filtered = filtered.filter(t => t.listId === listFilter);
    }
    return filtered;
  }, [allTasks, listFilter]);

  const active = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completed = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  // Sort function
  const sortTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
        case 'date':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'alpha':
          return (a.title || '').localeCompare(b.title || '');
        case 'created':
          return b.createdAt - a.createdAt;
        default:
          return (a.order ?? 0) - (b.order ?? 0);
      }
    });
  };

  // View-specific grouping
  const groups = useMemo(() => {
    switch (view) {
      case 'my-day': {
        const myDayTasks = active.filter(t => t.focusToday || (t.dueDate && isToday(t.dueDate)));
        return [{ label: 'My Day', tasks: sortTasks(myDayTasks), accent: 'var(--luma-warning)' }];
      }
      case 'priority': {
        const urgent = active.filter(t => t.priority === 'urgent');
        const high = active.filter(t => t.priority === 'high');
        const medium = active.filter(t => t.priority === 'medium');
        const low = active.filter(t => t.priority === 'low');
        const none = active.filter(t => t.priority === 'none');
        return [
          { label: '🔴 Urgent', tasks: urgent, accent: 'var(--luma-priority-urgent)' },
          { label: '🟠 High', tasks: high, accent: 'var(--luma-priority-high)' },
          { label: '🔵 Medium', tasks: medium, accent: 'var(--luma-priority-medium)' },
          { label: '🟢 Low', tasks: low, accent: 'var(--luma-priority-low)' },
          { label: 'No priority', tasks: none },
        ];
      }
      case 'date': {
        const overdue = active.filter(t => t.dueDate && isOverdue(t.dueDate) && !isToday(t.dueDate));
        const today = active.filter(t => t.dueDate && isToday(t.dueDate));
        const upcoming = active.filter(t => t.dueDate && isFuture(t.dueDate));
        const noDate = active.filter(t => !t.dueDate);
        return [
          { label: 'Overdue', tasks: sortTasks(overdue), accent: 'var(--luma-danger)' },
          { label: 'Today', tasks: sortTasks(today), accent: 'var(--luma-accent)' },
          { label: 'Upcoming', tasks: sortTasks(upcoming) },
          { label: 'No due date', tasks: sortTasks(noDate) },
        ];
      }
      case 'all':
      default: {
        return [{ label: 'Tasks', tasks: sortTasks(active) }];
      }
    }
  }, [view, active, sortBy]);

  const currentList = listFilter ? allLists.find(l => l.id === listFilter) : null;
  const pageTitle = currentList ? `${currentList.emoji} ${currentList.name}` : 'Tasks';

  return (
    <>
      <TopBar title={pageTitle} />
      <PageContainer>
        <div className="tasks-page">
          {/* View selector */}
          <div className="tasks-toolbar">
            <div className="tasks-views">
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  className={`tasks-view-btn ${view === v.id ? 'active' : ''}`}
                  onClick={() => setView(v.id)}
                >
                  <v.icon size={14} />
                  {v.label}
                </button>
              ))}
            </div>

            <div className="tasks-toolbar-right">
              <div className="tasks-sort">
                <label className="tasks-sort-label">Sort:</label>
                <select
                  className="tasks-sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <button
                className={`tasks-toggle-completed ${showCompleted ? 'active' : ''}`}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Hide done' : `Done (${completed.length})`}
              </button>
            </div>
          </div>

          {/* Task creation */}
          <TaskInput listId={listFilter || 'default'} />

          {/* Task groups */}
          {active.length === 0 && completed.length === 0 ? (
            <EmptyState
              icon={view === 'my-day' ? Sun : CircleCheck}
              heading={view === 'my-day' ? "Your day is clear" : "All clear"}
              body={view === 'my-day'
                ? "Add tasks to My Day to plan what you'll focus on today."
                : "Nothing on your plate. Add a task above when something comes up."
              }
            />
          ) : (
            <>
              {groups.map(g => (
                <TaskGroup
                  key={g.label}
                  label={g.label}
                  tasks={g.tasks}
                  accentColor={g.accent}
                />
              ))}
              {showCompleted && completed.length > 0 && (
                <TaskGroup
                  label={`Completed (${completed.length})`}
                  tasks={completed}
                  defaultOpen={false}
                />
              )}
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
