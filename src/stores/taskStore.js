import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      
      addTask: (overrides = {}) => {
        const task = {
          id: createId(),
          title: '',
          notes: '',
          completed: false,
          priority: 'none',
          dueDate: null,
          projectId: null,
          listId: 'default',
          tags: [],
          subtasks: [],
          status: 'todo',
          recurring: null,
          focusToday: false,
          order: Date.now(),
          createdAt: Date.now(),
          completedAt: null,
          trashedAt: null,
          ...overrides,
        };
        set(state => ({ tasks: [task, ...state.tasks] }));
        return task;
      },
      
      updateTask: (id, updates) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      
      toggleComplete: (id) => set(state => {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return state;
        
        const nowCompleted = !task.completed;
        let newTasks = state.tasks.map(t => t.id === id ? {
          ...t,
          completed: nowCompleted,
          completedAt: nowCompleted ? Date.now() : null,
          status: nowCompleted ? 'done' : 'todo',
        } : t);
        
        // Handle recurring: create next instance
        if (nowCompleted && task.recurring && task.dueDate) {
          const nextDate = getNextRecurringDate(task.dueDate, task.recurring);
          const newTask = {
            ...task,
            id: createId(),
            completed: false,
            completedAt: null,
            status: 'todo',
            dueDate: nextDate,
            order: Date.now(),
            createdAt: Date.now(),
            subtasks: task.subtasks.map(st => ({ ...st, completed: false })),
          };
          newTasks = [newTask, ...newTasks];
        }
        
        return { tasks: newTasks };
      }),
      
      // Subtask management
      addSubtask: (taskId, title) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          subtasks: [...t.subtasks, { id: createId(), title, completed: false }],
        } : t),
      })),
      
      toggleSubtask: (taskId, subtaskId) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st),
        } : t),
      })),
      
      removeSubtask: (taskId, subtaskId) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          subtasks: t.subtasks.filter(st => st.id !== subtaskId),
        } : t),
      })),
      
      // Focus Today
      toggleFocusToday: (id) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, focusToday: !t.focusToday } : t),
      })),
      
      // List management
      moveTask: (id, newListId) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, listId: newListId } : t),
      })),
      
      // Reorder
      reorderTasks: (orderedIds) => set(state => {
        const orderMap = {};
        orderedIds.forEach((id, index) => { orderMap[id] = index; });
        return {
          tasks: state.tasks.map(t => orderedIds.includes(t.id) ? { ...t, order: orderMap[t.id] } : t),
        };
      }),
      
      trashTask: (id) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, trashedAt: Date.now() } : t),
      })),
      restoreTask: (id) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, trashedAt: null } : t),
      })),
      deleteTask: (id) => set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
      })),
    }),
    { name: 'luma-tasks', storage: createJSONStorage(() => localStorage) }
  )
);

function getNextRecurringDate(currentDate, recurring) {
  const d = new Date(currentDate);
  switch (recurring) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    default: break;
  }
  return d.toISOString().split('T')[0];
}
