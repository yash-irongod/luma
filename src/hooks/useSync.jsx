import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSyncStore } from '../stores/syncStore';
import { useTaskStore } from '../stores/taskStore';
import { useNoteStore } from '../stores/noteStore';
import { useProjectStore } from '../stores/projectStore';
import { useListStore } from '../stores/listStore';
import { useTagStore } from '../stores/tagStore';
import {
  pushAll, pullAll, subscribeToChanges, unsubscribeAll, mergeData, COLLECTIONS,
} from '../lib/syncEngine';

const STORE_MAP = {
  tasks: { store: useTaskStore, getItems: s => s.tasks },
  notes: { store: useNoteStore, getItems: s => s.notes },
  projects: { store: useProjectStore, getItems: s => s.projects },
  lists: { store: useListStore, getItems: s => s.lists },
  tags: { store: useTagStore, getItems: s => s.tags },
};

/**
 * Hook that manages sync lifecycle. Call this ONLY in App.jsx.
 * Other components should use useSyncStore() to read sync status.
 */
export function useSync() {
  const { user } = useAuth();
  const initRef = useRef(false);

  const { setSyncStatus, setShowMergeDialog, setMergeData } = useSyncStore();
  const syncStatus = useSyncStore(s => s.syncStatus);
  const showMergeDialog = useSyncStore(s => s.showMergeDialog);

  // Start real-time listeners for all stores
  const startRealtimeSync = useCallback((uid) => {
    console.log('[Sync] Starting real-time listeners for', uid);
    for (const [name, config] of Object.entries(STORE_MAP)) {
      subscribeToChanges(uid, name, (remoteItems) => {
        const currentItems = config.getItems(config.store.getState());
        if (JSON.stringify(currentItems) !== JSON.stringify(remoteItems)) {
          console.log(`[Sync] Remote update for ${name}:`, remoteItems.length, 'items');
          config.store.setState({ [name]: remoteItems });
        }
      });
    }
    setSyncStatus('synced');
  }, [setSyncStatus]);

  // Apply cloud data to local stores
  const applyCloudData = useCallback((cloudData) => {
    for (const [name, items] of Object.entries(cloudData)) {
      if (STORE_MAP[name] && items.length > 0) {
        STORE_MAP[name].store.setState({ [name]: items });
      }
    }
  }, []);

  // Handle first login sync
  const handleFirstLogin = useCallback(async (uid) => {
    console.log('[Sync] Handling first login for', uid);
    setSyncStatus('syncing');
    try {
      // Returning user — auto-merge (union, newer wins)
      if (localStorage.getItem(`luma-synced-${uid}`)) {
        console.log('[Sync] Returning user, auto-merging');

        for (const [name, config] of Object.entries(STORE_MAP)) {
          const localItems = config.getItems(config.store.getState());
          const cloudItems = await pullAll(uid, name);

          // Merge: union of both, newer updatedAt wins on conflicts
          const merged = mergeData(localItems, cloudItems);
          config.store.setState({ [name]: merged });

          // Push merged result to cloud
          if (merged.length > 0) await pushAll(uid, name, merged);
        }

        startRealtimeSync(uid);
        return;
      }

      // Pull cloud data
      const cloudData = {};
      let hasCloudData = false;
      for (const name of COLLECTIONS) {
        const items = await pullAll(uid, name);
        cloudData[name] = items;
        if (items.length > 0) hasCloudData = true;
      }
      console.log('[Sync] Cloud data found:', hasCloudData);

      // Get local data
      const localData = {};
      let hasLocalData = false;
      for (const [name, config] of Object.entries(STORE_MAP)) {
        const items = config.getItems(config.store.getState());
        localData[name] = items;
        if (items.length > 0) hasLocalData = true;
      }
      console.log('[Sync] Local data found:', hasLocalData);

      if (hasCloudData && hasLocalData) {
        // First time — show merge dialog
        console.log('[Sync] Both have data, showing merge dialog');
        setMergeData({ localData, cloudData });
        setShowMergeDialog(true);
        setSyncStatus('idle');
      } else if (hasLocalData && !hasCloudData) {
        console.log('[Sync] Pushing local data to cloud');
        for (const [name, items] of Object.entries(localData)) {
          if (items.length > 0) await pushAll(uid, name, items);
        }
        localStorage.setItem(`luma-synced-${uid}`, 'true');
        startRealtimeSync(uid);
      } else if (hasCloudData && !hasLocalData) {
        console.log('[Sync] Pulling cloud data to local');
        applyCloudData(cloudData);
        localStorage.setItem(`luma-synced-${uid}`, 'true');
        startRealtimeSync(uid);
      } else {
        console.log('[Sync] Both empty, starting listeners');
        localStorage.setItem(`luma-synced-${uid}`, 'true');
        startRealtimeSync(uid);
      }
    } catch (err) {
      console.error('[Sync] First login error:', err);
      setSyncStatus('error');
    }
  }, [setSyncStatus, setShowMergeDialog, setMergeData, startRealtimeSync, applyCloudData]);

  // Handle merge decision from dialog
  const handleMerge = useCallback(async (decision) => {
    const mergeData_ = useSyncStore.getState().mergeData;
    if (!user || !mergeData_) return;

    console.log('[Sync] Merge decision:', decision);
    setSyncStatus('syncing');
    setShowMergeDialog(false);

    try {
      const { localData, cloudData } = mergeData_;

      if (decision === 'merge') {
        for (const name of COLLECTIONS) {
          const merged = mergeData(localData[name] || [], cloudData[name] || []);
          STORE_MAP[name].store.setState({ [name]: merged });
          await pushAll(user.uid, name, merged);
        }
      } else if (decision === 'cloud') {
        applyCloudData(cloudData);
      } else if (decision === 'local') {
        for (const [name, items] of Object.entries(localData)) {
          await pushAll(user.uid, name, items);
        }
      }

      localStorage.setItem(`luma-synced-${user.uid}`, 'true');
      startRealtimeSync(user.uid);
    } catch (err) {
      console.error('[Sync] Merge error:', err);
      setSyncStatus('error');
    }

    setMergeData(null);
  }, [user, setSyncStatus, setShowMergeDialog, setMergeData, startRealtimeSync, applyCloudData]);

  // React to auth changes — only run once per user change
  useEffect(() => {
    if (user && !initRef.current) {
      initRef.current = true;
      handleFirstLogin(user.uid);
    } else if (!user) {
      initRef.current = false;
      unsubscribeAll();
      setSyncStatus('idle');
    }

    return () => {
      if (!user) {
        unsubscribeAll();
      }
    };
  }, [user, handleFirstLogin, setSyncStatus]);

  return {
    syncStatus,
    showMergeDialog,
    handleMerge,
  };
}
