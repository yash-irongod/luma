import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      userName: '',
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set(state => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setUserName: (userName) => set({ userName }),
    }),
    { name: 'luma-ui', storage: createJSONStorage(() => localStorage) }
  )
);
