import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';

export const useListStore = create(
  persist(
    (set, get) => ({
      lists: [
        { id: 'default', name: 'Tasks', emoji: '📋', color: '#6C6BF0', isDefault: true, createdAt: Date.now() },
        { id: 'work', name: 'Work', emoji: '💼', color: '#3B82F6', isDefault: false, createdAt: Date.now() },
        { id: 'personal', name: 'Personal', emoji: '🏠', color: '#34D399', isDefault: false, createdAt: Date.now() },
      ],
      addList: (overrides = {}) => {
        const list = {
          id: createId(),
          name: '',
          emoji: '📋',
          color: '#6C6BF0',
          isDefault: false,
          createdAt: Date.now(),
          ...overrides,
        };
        set(state => ({ lists: [...state.lists, list] }));
        return list;
      },
      updateList: (id, updates) => set(state => ({
        lists: state.lists.map(l => l.id === id ? { ...l, ...updates } : l),
      })),
      deleteList: (id) => set(state => ({
        lists: state.lists.filter(l => l.id !== id || l.isDefault),
      })),
      getList: (id) => get().lists.find(l => l.id === id),
    }),
    { name: 'luma-lists', storage: createJSONStorage(() => localStorage) }
  )
);
