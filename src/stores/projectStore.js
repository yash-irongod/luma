import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';
import { pushItem, deleteItem } from '../lib/syncEngine';
import { auth } from '../lib/firebase';

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
          updatedAt: Date.now(),
          trashedAt: null,
          ...overrides,
        };
        set(state => ({ projects: [project, ...state.projects] }));
        const uid = auth.currentUser?.uid;
        if (uid) pushItem(uid, 'projects', project);
        return project;
      },
      updateProject: (id, updates) => {
        let updatedProject;
        set(state => {
          const projects = state.projects.map(p => {
            if (p.id === id) {
              updatedProject = { ...p, ...updates, updatedAt: Date.now() };
              return updatedProject;
            }
            return p;
          });
          return { projects };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedProject) pushItem(uid, 'projects', updatedProject);
      },
      trashProject: (id) => {
        let updatedProject;
        set(state => {
          const projects = state.projects.map(p => {
            if (p.id === id) {
              updatedProject = { ...p, trashedAt: Date.now(), updatedAt: Date.now() };
              return updatedProject;
            }
            return p;
          });
          return { projects };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedProject) pushItem(uid, 'projects', updatedProject);
      },
      restoreProject: (id) => {
        let updatedProject;
        set(state => {
          const projects = state.projects.map(p => {
            if (p.id === id) {
              updatedProject = { ...p, trashedAt: null, updatedAt: Date.now() };
              return updatedProject;
            }
            return p;
          });
          return { projects };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedProject) pushItem(uid, 'projects', updatedProject);
      },
      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
        }));
        const uid = auth.currentUser?.uid;
        if (uid) deleteItem(uid, 'projects', id);
      },
    }),
    { name: 'luma-projects', storage: createJSONStorage(() => localStorage) }
  )
);
