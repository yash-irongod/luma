import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';

export const useTagStore = create(
  persist(
    (set, get) => ({
      tags: [],
      addTag: (overrides = {}) => {
        const tag = {
          id: createId(),
          name: '',
          color: '#6C6BF0',
          ...overrides,
        };
        set(state => ({ tags: [...state.tags, tag] }));
        return tag;
      },
      updateTag: (id, updates) => set(state => ({
        tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTag: (id) => set(state => ({
        tags: state.tags.filter(t => t.id !== id),
      })),
    }),
    { name: 'luma-tags', storage: createJSONStorage(() => localStorage) }
  )
);
