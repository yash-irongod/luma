import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createId } from '../utils/id';
import { pushItem, deleteItem } from '../lib/syncEngine';
import { auth } from '../lib/firebase';

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
        const uid = auth.currentUser?.uid;
        if (uid) pushItem(uid, 'notes', note);
        return note;
      },
      updateNote: (id, updates) => {
        let updatedNote;
        set(state => {
          const notes = state.notes.map(n => {
            if (n.id === id) {
              updatedNote = { ...n, ...updates, updatedAt: Date.now() };
              return updatedNote;
            }
            return n;
          });
          return { notes };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedNote) pushItem(uid, 'notes', updatedNote);
      },
      trashNote: (id) => {
        let updatedNote;
        set(state => {
          const notes = state.notes.map(n => {
            if (n.id === id) {
              updatedNote = { ...n, trashedAt: Date.now(), updatedAt: Date.now() };
              return updatedNote;
            }
            return n;
          });
          return { notes };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedNote) pushItem(uid, 'notes', updatedNote);
      },
      restoreNote: (id) => {
        let updatedNote;
        set(state => {
          const notes = state.notes.map(n => {
            if (n.id === id) {
              updatedNote = { ...n, trashedAt: null, updatedAt: Date.now() };
              return updatedNote;
            }
            return n;
          });
          return { notes };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedNote) pushItem(uid, 'notes', updatedNote);
      },
      deleteNote: (id) => {
        set(state => ({
          notes: state.notes.filter(n => n.id !== id),
        }));
        const uid = auth.currentUser?.uid;
        if (uid) deleteItem(uid, 'notes', id);
      },
      togglePin: (id) => {
        let updatedNote;
        set(state => {
          const notes = state.notes.map(n => {
            if (n.id === id) {
              updatedNote = { ...n, isPinned: !n.isPinned, updatedAt: Date.now() };
              return updatedNote;
            }
            return n;
          });
          return { notes };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedNote) pushItem(uid, 'notes', updatedNote);
      },
      toggleFavorite: (id) => {
        let updatedNote;
        set(state => {
          const notes = state.notes.map(n => {
            if (n.id === id) {
              updatedNote = { ...n, isFavorite: !n.isFavorite, updatedAt: Date.now() };
              return updatedNote;
            }
            return n;
          });
          return { notes };
        });
        const uid = auth.currentUser?.uid;
        if (uid && updatedNote) pushItem(uid, 'notes', updatedNote);
      },
    }),
    { name: 'luma-notes', storage: createJSONStorage(() => localStorage) }
  )
);
