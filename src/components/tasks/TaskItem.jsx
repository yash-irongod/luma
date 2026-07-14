import { useState, memo } from 'react';
import { motion } from 'motion/react';
import { useTaskStore } from '../../stores/taskStore';
import { useListStore } from '../../stores/listStore';
import PriorityBadge from '../common/PriorityBadge';
import DatePicker from '../common/DatePicker';
import Dropdown, { DropdownItem } from '../common/Dropdown';
import { toast } from '../common/Toast';
import {
  Trash2, MoreHorizontal, GripVertical, ChevronDown, ChevronRight,
  Plus, Sun, Repeat, Flag, ArrowRight
} from 'lucide-react';
import { formatDate } from '../../utils/dates';
import { PRIORITIES } from '../../utils/constants';
import './TaskItem.css';

const TaskItem = memo(function TaskItem({ task, compact = false, dragHandleProps }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showSubtasks, setShowSubtasks] = useState(task.subtasks?.length > 0);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const toggleComplete = useTaskStore(s => s.toggleComplete);
  const updateTask = useTaskStore(s => s.updateTask);
  const trashTask = useTaskStore(s => s.trashTask);
  const addSubtask = useTaskStore(s => s.addSubtask);
  const toggleSubtask = useTaskStore(s => s.toggleSubtask);
  const removeSubtask = useTaskStore(s => s.removeSubtask);
  const toggleFocusToday = useTaskStore(s => s.toggleFocusToday);
  const lists = useListStore(s => s.lists);

  const handleCheck = () => {
    toggleComplete(task.id);
    if (!task.completed) {
      toast.success(task.recurring ? 'Done — next one created' : 'Task completed');
    }
  };

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    } else {
      setEditTitle(task.title);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false); }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <motion.div
      className={`task-item ${task.completed ? 'completed' : ''} ${compact ? 'compact' : ''}`}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.15 }}
    >
      <div className="task-item-row">
        {!compact && dragHandleProps && (
          <div className="task-drag-handle" {...dragHandleProps}>
            <GripVertical size={14} />
          </div>
        )}

        <button
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={handleCheck}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          style={!task.completed && task.priority !== 'none' ? {
            borderColor: PRIORITIES.find(p => p.value === task.priority)?.color
          } : undefined}
        >
          {task.completed && <span className="task-checkmark">✓</span>}
        </button>

        <div className="task-content">
          {editing ? (
            <input
              className="task-edit-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <span className="task-title" onDoubleClick={() => setEditing(true)}>
              {task.title || 'Untitled task'}
            </span>
          )}

          {/* Meta chips row */}
          <div className="task-chips">
            {totalSubtasks > 0 && (
              <button
                className="task-chip task-chip-subtasks"
                onClick={() => setShowSubtasks(!showSubtasks)}
              >
                {showSubtasks ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {completedSubtasks}/{totalSubtasks}
              </button>
            )}
            {task.recurring && (
              <span className="task-chip task-chip-recurring">
                <Repeat size={11} /> {task.recurring}
              </span>
            )}
            {task.focusToday && (
              <span className="task-chip task-chip-focus">
                <Sun size={11} /> My Day
              </span>
            )}
          </div>
        </div>

        <div className="task-meta">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <DatePicker
              value={task.dueDate}
              onChange={(date) => updateTask(task.id, { dueDate: date })}
              trigger={
                <span className={`task-due-chip ${isOverdue ? 'overdue' : ''}`}>
                  {formatDate(new Date(task.dueDate).getTime())}
                </span>
              }
            />
          )}
          {!task.dueDate && !compact && (
            <DatePicker
              value={null}
              onChange={(date) => updateTask(task.id, { dueDate: date })}
            />
          )}
        </div>

        {!compact && (
          <div className="task-actions">
            <Dropdown
              align="right"
              trigger={
                <button className="task-action-btn" aria-label="More actions">
                  <MoreHorizontal size={14} />
                </button>
              }
            >
              {/* Priority submenu */}
              {PRIORITIES.map(p => (
                <DropdownItem key={p.value} onClick={() => updateTask(task.id, { priority: p.value })}>
                  <span className="priority-dot-small" style={{ background: p.color }} />
                  {p.label} {task.priority === p.value ? '✓' : ''}
                </DropdownItem>
              ))}

              <div className="dropdown-separator" />

              <DropdownItem onClick={() => toggleFocusToday(task.id)}>
                <Sun size={14} /> {task.focusToday ? 'Remove from My Day' : 'Add to My Day'}
              </DropdownItem>

              <DropdownItem onClick={() => { setShowSubtaskInput(true); setShowSubtasks(true); }}>
                <Plus size={14} /> Add subtask
              </DropdownItem>

              {/* Move to list */}
              {lists.length > 1 && (
                <>
                  <div className="dropdown-separator" />
                  {lists.map(l => (
                    <DropdownItem
                      key={l.id}
                      onClick={() => {
                        updateTask(task.id, { listId: l.id });
                        toast.info(`Moved to ${l.name}`);
                      }}
                    >
                      <ArrowRight size={14} /> {l.emoji} {l.name} {task.listId === l.id ? '✓' : ''}
                    </DropdownItem>
                  ))}
                </>
              )}

              {/* Recurring */}
              <div className="dropdown-separator" />
              {['none', 'daily', 'weekly', 'monthly'].map(r => (
                <DropdownItem
                  key={r}
                  onClick={() => updateTask(task.id, { recurring: r === 'none' ? null : r })}
                >
                  <Repeat size={14} /> {r === 'none' ? 'No repeat' : `Repeat ${r}`} {(task.recurring || 'none') === (r === 'none' ? null : r) || (!task.recurring && r === 'none') ? '✓' : ''}
                </DropdownItem>
              ))}

              <div className="dropdown-separator" />

              <DropdownItem danger onClick={() => { trashTask(task.id); toast.info('Moved to trash'); }}>
                <Trash2 size={14} /> Delete
              </DropdownItem>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Subtasks */}
      {showSubtasks && totalSubtasks > 0 && (
        <div className="subtask-list">
          {task.subtasks.map(st => (
            <div key={st.id} className={`subtask-item ${st.completed ? 'completed' : ''}`}>
              <button
                className={`subtask-checkbox ${st.completed ? 'checked' : ''}`}
                onClick={() => toggleSubtask(task.id, st.id)}
              >
                {st.completed && <span className="task-checkmark">✓</span>}
              </button>
              <span className="subtask-title">{st.title}</span>
              <button
                className="subtask-remove"
                onClick={() => removeSubtask(task.id, st.id)}
                aria-label="Remove subtask"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask input */}
      {showSubtaskInput && (
        <form className="subtask-add" onSubmit={handleAddSubtask}>
          <Plus size={12} />
          <input
            className="subtask-add-input"
            placeholder="Add subtask..."
            value={newSubtask}
            onChange={e => setNewSubtask(e.target.value)}
            onBlur={() => { if (!newSubtask.trim()) setShowSubtaskInput(false); }}
            autoFocus
          />
        </form>
      )}
    </motion.div>
  );
});

export default TaskItem;
