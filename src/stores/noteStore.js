import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';

export const useNoteStore = create(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (overrides = {}) => {
        const note = {
          id: createId(),
          title: '',
          content: null,
          excerpt: '',
          projectId: null,
          tags: [],
          isPinned: false,
          isFavorite: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          trashedAt: null,
          ...overrides,
        };
        set(state => ({ notes: [note, ...state.notes] }));
        return note;
      },
      updateNote: (id, updates) => set(state => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n),
      })),
      trashNote: (id) => set(state => ({
        notes: state.notes.map(n => n.id === id ? { ...n, trashedAt: Date.now() } : n),
      })),
      restoreNote: (id) => set(state => ({
        notes: state.notes.map(n => n.id === id ? { ...n, trashedAt: null } : n),
      })),
      deleteNote: (id) => set(state => ({
        notes: state.notes.filter(n => n.id !== id),
      })),
      togglePin: (id) => set(state => ({
        notes: state.notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n),
      })),
      toggleFavorite: (id) => set(state => ({
        notes: state.notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n),
      })),
    }),
    { name: 'luma-notes', storage: createJSONStorage(() => localStorage) }
  )
);
