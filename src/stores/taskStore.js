import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';
import { pushItem, deleteItem } from '../lib/syncEngine';
import { auth } from '../lib/firebase';

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
          updatedAt: Date.now(),
          completedAt: null,
          trashedAt: null,
          ...overrides,
        };
        set(state => ({ tasks: [task, ...state.tasks] }));
        const uid = auth.currentUser?.uid;
        if (uid) pushItem(uid, 'tasks', task);
        return task;
      },
      
      updateTask: (id, updates) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === id) {
              updatedTask = { ...t, ...updates, updatedAt: Date.now() };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      
      toggleComplete: (id) => {
        let updatedTask, newTaskInstance;
        set(state => {
          const task = state.tasks.find(t => t.id === id);
          if (!task) return state;
          
          const nowCompleted = !task.completed;
          updatedTask = {
            ...task,
            completed: nowCompleted,
            completedAt: nowCompleted ? Date.now() : null,
            status: nowCompleted ? 'done' : 'todo',
            updatedAt: Date.now(),
          };
          
          let newTasks = state.tasks.map(t => t.id === id ? updatedTask : t);
          
          // Handle recurring: create next instance
          if (nowCompleted && task.recurring && task.dueDate) {
            const nextDate = getNextRecurringDate(task.dueDate, task.recurring);
            newTaskInstance = {
              ...task,
              id: createId(),
              completed: false,
              completedAt: null,
              status: 'todo',
              dueDate: nextDate,
              order: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              subtasks: task.subtasks.map(st => ({ ...st, completed: false })),
            };
            newTasks = [newTaskInstance, ...newTasks];
          }
          
          return { tasks: newTasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid) {
          if (updatedTask) pushItem(uid, 'tasks', updatedTask);
          if (newTaskInstance) pushItem(uid, 'tasks', newTaskInstance);
        }
      },
      
      // Subtask management
      addSubtask: (taskId, title) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === taskId) {
              updatedTask = {
                ...t,
                subtasks: [...t.subtasks, { id: createId(), title, completed: false }],
                updatedAt: Date.now(),
              };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      
      toggleSubtask: (taskId, subtaskId) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === taskId) {
              updatedTask = {
                ...t,
                subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st),
                updatedAt: Date.now(),
              };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      
      removeSubtask: (taskId, subtaskId) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === taskId) {
              updatedTask = {
                ...t,
                subtasks: t.subtasks.filter(st => st.id !== subtaskId),
                updatedAt: Date.now(),
              };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },

      updateSubtask: (taskId, subtaskId, title) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === taskId) {
              updatedTask = {
                ...t,
                subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, title } : st),
                updatedAt: Date.now(),
              };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },

      moveSubtask: (taskId, subtaskId, direction) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const idx = t.subtasks.findIndex(st => st.id === subtaskId);
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= t.subtasks.length) return t;
            const arr = [...t.subtasks];
            [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
            updatedTask = { ...t, subtasks: arr, updatedAt: Date.now() };
            return updatedTask;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      
      // Focus Today
      toggleFocusToday: (id) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === id) {
              updatedTask = { ...t, focusToday: !t.focusToday, updatedAt: Date.now() };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      
      // List management
      moveTask: (id, newListId) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === id) {
              updatedTask = { ...t, listId: newListId, updatedAt: Date.now() };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      
      // Reorder
      reorderTasks: (orderedIds) => {
        const updatedTasks = [];
        set(state => {
          const orderMap = {};
          orderedIds.forEach((id, index) => { orderMap[id] = index; });
          const tasks = state.tasks.map(t => {
            if (orderedIds.includes(t.id)) {
              const u = { ...t, order: orderMap[t.id], updatedAt: Date.now() };
              updatedTasks.push(u);
              return u;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTasks.length > 0) {
          updatedTasks.forEach(u => pushItem(uid, 'tasks', u));
        }
      },
      
      trashTask: (id) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === id) {
              updatedTask = { ...t, trashedAt: Date.now(), updatedAt: Date.now() };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      restoreTask: (id) => {
        let updatedTask;
        set(state => {
          const tasks = state.tasks.map(t => {
            if (t.id === id) {
              updatedTask = { ...t, trashedAt: null, updatedAt: Date.now() };
              return updatedTask;
            }
            return t;
          });
          return { tasks };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTask) pushItem(uid, 'tasks', updatedTask);
      },
      deleteTask: (id) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
        const uid = auth.currentUser?.uid;
        if (uid) deleteItem(uid, 'tasks', id);
      },
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
