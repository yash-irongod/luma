import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (overrides = {}) => {
        const project = {
          id: createId(),
          name: '',
          description: '',
          emoji: '📁',
          color: '#6C6BF0',
          order: 0,
          createdAt: Date.now(),
          trashedAt: null,
          ...overrides,
        };
        set(state => ({ projects: [project, ...state.projects] }));
        return project;
      },
      updateProject: (id, updates) => set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      })),
      trashProject: (id) => set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, trashedAt: Date.now() } : p),
      })),
      restoreProject: (id) => set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, trashedAt: null } : p),
      })),
      deleteProject: (id) => set(state => ({
        projects: state.projects.filter(p => p.id !== id),
      })),
    }),
    { name: 'luma-projects', storage: createJSONStorage(() => localStorage) }
  )
);
