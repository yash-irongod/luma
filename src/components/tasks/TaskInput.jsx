import { useState, useRef } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useListStore } from '../../stores/listStore';
import { PRIORITIES } from '../../utils/constants';
import DatePicker from '../common/DatePicker';
import { toast } from '../common/Toast';
import { Plus, Flag, List } from 'lucide-react';
import './TaskInput.css';

export default function TaskInput({ listId = null, projectId = null }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('none');
  const [dueDate, setDueDate] = useState(null);
  const [showPriority, setShowPriority] = useState(false);
  const addTask = useTaskStore(s => s.addTask);
  const inputRef = useRef(null);
  const priorityRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      priority,
      dueDate,
      listId: listId || 'default',
      projectId,
    });
    setTitle('');
    setPriority('none');
    setDueDate(null);
    toast.success('Task added');
    inputRef.current?.focus();
  };

  const currentPriority = PRIORITIES.find(p => p.value === priority);

  return (
    <form className="task-input-bar" onSubmit={handleSubmit}>
      <div className="task-input-main">
        <Plus size={16} className="task-input-icon" />
        <input
          ref={inputRef}
          className="task-input-field"
          placeholder="Add a task..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="task-input-actions">
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
        />

        <div className="task-input-priority-wrapper" ref={priorityRef}>
          <button
            type="button"
            className={`task-input-chip ${priority !== 'none' ? 'active' : ''}`}
            onClick={() => setShowPriority(!showPriority)}
            title="Set priority"
          >
            <Flag size={14} />
            {priority !== 'none' && (
              <span
                className="task-input-priority-dot"
                style={{ background: currentPriority?.color }}
              />
            )}
          </button>

          {showPriority && (
            <div className="task-input-priority-dropdown">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`task-input-priority-option ${priority === p.value ? 'selected' : ''}`}
                  onClick={() => { setPriority(p.value); setShowPriority(false); }}
                >
                  <span className="priority-dot-small" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="task-input-submit"
          disabled={!title.trim()}
        >
          Add
        </button>
      </div>
    </form>
  );
}
