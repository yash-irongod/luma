import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';
import { pushItem, deleteItem } from '../lib/syncEngine';
import { auth } from '../lib/firebase';

export const useListStore = create(
  persist(
    (set, get) => ({
      lists: [
        { id: 'default', name: 'Tasks', emoji: '📋', color: '#6C6BF0', isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'work', name: 'Work', emoji: '💼', color: '#3B82F6', isDefault: false, createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'personal', name: 'Personal', emoji: '🏠', color: '#34D399', isDefault: false, createdAt: Date.now(), updatedAt: Date.now() },
      ],
      addList: (overrides = {}) => {
        const list = {
          id: createId(),
          name: '',
          emoji: '📋',
          color: '#6C6BF0',
          isDefault: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...overrides,
        };
        set(state => ({ lists: [...state.lists, list] }));
        const uid = auth.currentUser?.uid;
        if (uid) pushItem(uid, 'lists', list);
        return list;
      },
      updateList: (id, updates) => {
        let updatedList;
        set(state => {
          const lists = state.lists.map(l => {
            if (l.id === id) {
              updatedList = { ...l, ...updates, updatedAt: Date.now() };
              return updatedList;
            }
            return l;
          });
          return { lists };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedList) pushItem(uid, 'lists', updatedList);
      },
      deleteList: (id) => {
        set(state => ({
          lists: state.lists.filter(l => l.id !== id || l.isDefault),
        }));
        const uid = auth.currentUser?.uid;
        if (uid) deleteItem(uid, 'lists', id);
      },
      getList: (id) => get().lists.find(l => l.id === id),
    }),
    { name: 'luma-lists', storage: createJSONStorage(() => localStorage) }
  )
);
