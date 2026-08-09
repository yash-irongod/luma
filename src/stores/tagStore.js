import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';
import { pushItem, deleteItem } from '../lib/syncEngine';
import { auth } from '../lib/firebase';

export const useTagStore = create(
  persist(
    (set, get) => ({
      tags: [],
      addTag: (overrides = {}) => {
        const tag = {
          id: createId(),
          name: '',
          color: '#6C6BF0',
          updatedAt: Date.now(),
          ...overrides,
        };
        set(state => ({ tags: [...state.tags, tag] }));
        const uid = auth.currentUser?.uid;
        if (uid) pushItem(uid, 'tags', tag);
        return tag;
      },
      updateTag: (id, updates) => {
        let updatedTag;
        set(state => {
          const tags = state.tags.map(t => {
            if (t.id === id) {
              updatedTag = { ...t, ...updates, updatedAt: Date.now() };
              return updatedTag;
            }
            return t;
          });
          return { tags };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedTag) pushItem(uid, 'tags', updatedTag);
      },
      deleteTag: (id) => {
        set(state => ({
          tags: state.tags.filter(t => t.id !== id),
        }));
        const uid = auth.currentUser?.uid;
        if (uid) deleteItem(uid, 'tags', id);
      },
    }),
    { name: 'luma-tags', storage: createJSONStorage(() => localStorage) }
  )
);
