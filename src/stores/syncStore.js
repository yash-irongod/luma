import { create } from 'zustand';

// Global sync state — shared across all components
export const useSyncStore = create((set) => ({
  syncStatus: 'idle', // 'idle' | 'syncing' | 'synced' | 'error'
  showMergeDialog: false,
  mergeData: null,

  setSyncStatus: (status) => set({ syncStatus: status }),
  setShowMergeDialog: (show) => set({ showMergeDialog: show }),
  setMergeData: (data) => set({ mergeData: data }),
}));
