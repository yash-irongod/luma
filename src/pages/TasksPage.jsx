import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import TaskInput from '../components/tasks/TaskInput';
import TaskGroup from '../components/tasks/TaskGroup';
import EmptyState from '../components/common/EmptyState';
import { useTaskStore } from '../stores/taskStore';
import { useListStore } from '../stores/listStore';
import { CircleCheck, Sun, ListFilter, ArrowUpDown } from 'lucide-react';
import { isToday, isOverdue, isFuture } from '../utils/dates';
import './TasksPage.css';

const VIEWS = [
  { id: 'my-day', label: 'My Day', icon: Sun },
  { id: 'all', label: 'All Tasks', icon: ListFilter },
  { id: 'priority', label: 'By Priority', icon: ArrowUpDown },
  { id: 'date', label: 'By Date', icon: ListFilter },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const byPriority = (a, b) => {
  const diff = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
  return diff !== 0 ? diff : byOrder(a, b);
};

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const listParam = searchParams.get('list');
  const isMyDayRoute = listParam === 'my-day';
  const listFilter = isMyDayRoute ? null : listParam;

  const [view, setView] = useState(isMyDayRoute ? 'my-day' : 'all');
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

  // View-specific grouping — each view has its own built-in sort
  const groups = useMemo(() => {
    switch (view) {
      case 'my-day': {
        const myDayTasks = [...active.filter(t => t.focusToday || (t.dueDate && isToday(t.dueDate)))].sort(byPriority);
        return [{ label: 'My Day', tasks: myDayTasks, accent: 'var(--luma-warning)' }];
      }
      case 'priority': {
        const urgent = [...active.filter(t => t.priority === 'urgent')].sort(byOrder);
        const high = [...active.filter(t => t.priority === 'high')].sort(byOrder);
        const medium = [...active.filter(t => t.priority === 'medium')].sort(byOrder);
        const low = [...active.filter(t => t.priority === 'low')].sort(byOrder);
        const none = [...active.filter(t => t.priority === 'none')].sort(byOrder);
        return [
          { label: '🔴 Urgent', tasks: urgent, accent: 'var(--luma-priority-urgent)' },
          { label: '🟠 High', tasks: high, accent: 'var(--luma-priority-high)' },
          { label: '🔵 Medium', tasks: medium, accent: 'var(--luma-priority-medium)' },
          { label: '🟢 Low', tasks: low, accent: 'var(--luma-priority-low)' },
          { label: 'No priority', tasks: none },
        ];
      }
      case 'date': {
        const overdue = [...active.filter(t => t.dueDate && isOverdue(t.dueDate) && !isToday(t.dueDate))].sort(byPriority);
        const today = [...active.filter(t => t.dueDate && isToday(t.dueDate))].sort(byPriority);
        const upcoming = [...active.filter(t => t.dueDate && isFuture(t.dueDate))].sort(byPriority);
        const noDate = [...active.filter(t => !t.dueDate)].sort(byPriority);
        return [
          { label: 'Overdue', tasks: overdue, accent: 'var(--luma-danger)' },
          { label: 'Today', tasks: today, accent: 'var(--luma-accent)' },
          { label: 'Upcoming', tasks: upcoming },
          { label: 'No due date', tasks: noDate },
        ];
      }
      case 'all':
      default: {
        return [{ label: 'Tasks', tasks: [...active].sort(byOrder) }];
      }
    }
  }, [view, active]);

  const currentList = listFilter ? allLists.find(l => l.id === listFilter) : null;
  const pageTitle = currentList ? `${currentList.emoji} ${currentList.name}` : 'Tasks';

  // My Day completion stats
  const allMyDay = useMemo(() => {
    return allTasks.filter(t => !t.trashedAt && (t.focusToday || (t.dueDate && isToday(t.dueDate))));
  }, [allTasks]);
  const myDayDone = allMyDay.filter(t => t.completed).length;
  const myDayTotal = allMyDay.length;
  const myDayPercent = myDayTotal > 0 ? Math.round((myDayDone / myDayTotal) * 100) : 0;

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

            <button
              className={`tasks-toggle-completed ${showCompleted ? 'active' : ''}`}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide done' : `Done (${completed.length})`}
            </button>
          </div>

          {/* Task creation */}
          <TaskInput listId={listFilter || 'default'} />

          {/* My Day progress */}
          {view === 'my-day' && myDayTotal > 0 && (
            <div className="tasks-myday-progress">
              <div className="tasks-myday-progress-bar">
                <div
                  className="tasks-myday-progress-fill"
                  style={{ width: `${myDayPercent}%` }}
                />
              </div>
              <span className="tasks-myday-progress-text">
                {myDayDone}/{myDayTotal} done
              </span>
            </div>
          )}

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
