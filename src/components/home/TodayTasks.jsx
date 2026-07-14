import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../stores/taskStore';
import TaskItem from '../tasks/TaskItem';
import { isToday, isOverdue } from '../../utils/dates';

export default function TodayTasks() {
  const navigate = useNavigate();
  const allTasks = useTaskStore(s => s.tasks);

  const activeTasks = useMemo(() => allTasks.filter(t => !t.trashedAt && !t.completed), [allTasks]);
  const overdueTasks = useMemo(() => activeTasks.filter(t => t.dueDate && isOverdue(t.dueDate) && !isToday(t.dueDate)), [activeTasks]);
  const todayTasks = useMemo(() => activeTasks.filter(t => t.dueDate && isToday(t.dueDate)), [activeTasks]);

  if (overdueTasks.length === 0 && todayTasks.length === 0) return null;

  return (
    <div className="today-tasks">
      {overdueTasks.length > 0 && (
        <div className="today-tasks-group">
          <div className="today-tasks-header">
            <span className="today-tasks-label" style={{ color: 'var(--luma-danger)' }}>Overdue</span>
            <span className="today-tasks-count">{overdueTasks.length}</span>
          </div>
          {overdueTasks.slice(0, 4).map(task => (
            <TaskItem key={task.id} task={task} compact />
          ))}
        </div>
      )}

      {todayTasks.length > 0 && (
        <div className="today-tasks-group">
          <div className="today-tasks-header">
            <span className="today-tasks-label">Today</span>
            <span className="today-tasks-count">{todayTasks.length}</span>
          </div>
          {todayTasks.slice(0, 6).map(task => (
            <TaskItem key={task.id} task={task} compact />
          ))}
        </div>
      )}

      {(overdueTasks.length + todayTasks.length) > 6 && (
        <button className="today-tasks-more" onClick={() => navigate('/tasks')}>
          View all tasks →
        </button>
      )}
    </div>
  );
}
