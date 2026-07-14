import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import TaskItem from './TaskItem';
import { useTaskStore } from '../../stores/taskStore';
import './TaskGroup.css';

function SortableTaskItem({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskItem task={task} dragHandleProps={listeners} />
    </div>
  );
}

export default function TaskGroup({ label, tasks, defaultOpen = true, accentColor }) {
  const [open, setOpen] = useState(defaultOpen);
  const reorderTasks = useTaskStore(s => s.reorderTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (tasks.length === 0) return null;

  const taskIds = tasks.map(t => t.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskIds.indexOf(active.id);
    const newIndex = taskIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...taskIds];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id);
    reorderTasks(reordered);
  };

  return (
    <div className="task-group">
      <button className="task-group-header" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="task-group-label" style={accentColor ? { color: accentColor } : undefined}>
          {label}
        </span>
        <span className="task-group-count">{tasks.length}</span>
      </button>
      {open && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="task-group-list">
              {tasks.map(task => (
                <SortableTaskItem key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
