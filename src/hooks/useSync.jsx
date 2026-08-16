import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSyncStore } from '../stores/syncStore';
import { useTaskStore } from '../stores/taskStore';
import { useNoteStore } from '../stores/noteStore';
import { useProjectStore } from '../stores/projectStore';
import { useListStore } from '../stores/listStore';
import { useTagStore } from '../stores/tagStore';
import {
  pushAll, pullAll, subscribeToChanges, unsubscribeAll,
  mergeData, getTombstones, cleanOldTombstones, COLLECTIONS,
} from '../lib/syncEngine';

const STORE_MAP = {
  tasks: { store: useTaskStore, getItems: s => s.tasks },
  notes: { store: useNoteStore, getItems: s => s.notes },
  projects: { store: useProjectStore, getItems: s => s.projects },
  lists: { store: useListStore, getItems: s => s.lists },
  tags: { store: useTagStore, getItems: s => s.tags },
};

/**
 * Hook that manages sync lifecycle. Call ONLY in App.jsx.
 * Other components read sync status from useSyncStore().
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

  // Handle first login or returning user sync
  const handleSync = useCallback(async (uid) => {
    console.log('[Sync] Starting sync for', uid);
    setSyncStatus('syncing');

    try {
      // Fetch tombstones (deletion records) from cloud
      const tombstones = await getTombstones(uid);
      console.log('[Sync] Fetched', tombstones.length, 'tombstones');

      // Check if returning user
      const isReturningUser = !!localStorage.getItem(`luma-synced-${uid}`);

      // Get local data
      const localData = {};
      let hasLocalData = false;
      for (const [name, config] of Object.entries(STORE_MAP)) {
        localData[name] = config.getItems(config.store.getState());
        if (localData[name].length > 0) hasLocalData = true;
      }

      // Get cloud data
      const cloudData = {};
      let hasCloudData = false;
      for (const name of COLLECTIONS) {
        cloudData[name] = await pullAll(uid, name);
        if (cloudData[name].length > 0) hasCloudData = true;
      }

      console.log('[Sync] Local:', hasLocalData, '| Cloud:', hasCloudData, '| Returning:', isReturningUser);

      if (isReturningUser) {
        // ── Returning user: auto-merge with tombstone awareness ──
        console.log('[Sync] Auto-merging with tombstone checking');
        for (const name of COLLECTIONS) {
          const merged = mergeData(
            localData[name] || [],
            cloudData[name] || [],
            tombstones,
            name
          );
          STORE_MAP[name].store.setState({ [name]: merged });
          if (merged.length > 0) await pushAll(uid, name, merged);
        }
        startRealtimeSync(uid);

      } else if (hasCloudData && hasLocalData) {
        // ── First login with both data: show merge dialog ──
        console.log('[Sync] First login, both have data — showing merge dialog');
        setMergeData({ localData, cloudData, tombstones });
        setShowMergeDialog(true);
        setSyncStatus('idle');
        return; // Don't set synced flag yet — wait for user decision

      } else if (hasLocalData) {
        // ── First login, only local data: push to cloud ──
        console.log('[Sync] Pushing local data to cloud');
        for (const [name, items] of Object.entries(localData)) {
          if (items.length > 0) await pushAll(uid, name, items);
        }
        startRealtimeSync(uid);

      } else if (hasCloudData) {
        // ── First login, only cloud data: pull to local ──
        console.log('[Sync] Pulling cloud data to local');
        applyCloudData(cloudData);
        startRealtimeSync(uid);

      } else {
        // ── Both empty ──
        console.log('[Sync] Both empty, starting listeners');
        startRealtimeSync(uid);
      }

      // Mark as synced
      localStorage.setItem(`luma-synced-${uid}`, 'true');

      // Clean old tombstones (background, non-blocking)
      cleanOldTombstones(uid).catch(() => {});

    } catch (err) {
      console.error('[Sync] Sync error:', err);
      setSyncStatus('error');
    }
  }, [setSyncStatus, setShowMergeDialog, setMergeData, startRealtimeSync, applyCloudData]);

  // Handle merge decision from dialog
  const handleMerge = useCallback(async (decision) => {
    const { mergeData: mergeData_, ...rest } = useSyncStore.getState();
    if (!user || !mergeData_) return;

    console.log('[Sync] Merge decision:', decision);
    setSyncStatus('syncing');
    setShowMergeDialog(false);

    try {
      const { localData, cloudData, tombstones = [] } = mergeData_;

      if (decision === 'merge') {
        // Union of both, tombstone-aware
        for (const name of COLLECTIONS) {
          const merged = mergeData(
            localData[name] || [],
            cloudData[name] || [],
            tombstones,
            name
          );
          STORE_MAP[name].store.setState({ [name]: merged });
          await pushAll(user.uid, name, merged);
        }
      } else if (decision === 'cloud') {
        applyCloudData(cloudData);
      } else if (decision === 'local') {
        for (const [name, items] of Object.entries(localData)) {
          if (items.length > 0) await pushAll(user.uid, name, items);
        }
      }

      localStorage.setItem(`luma-synced-${user.uid}`, 'true');
      startRealtimeSync(user.uid);
    } catch (err) {
      console.error('[Sync] Merge error:', err);
      setSyncStatus('error');
    }

    useSyncStore.getState().setMergeData(null);
  }, [user, setSyncStatus, setShowMergeDialog, startRealtimeSync, applyCloudData]);

  // React to auth changes
  useEffect(() => {
    if (user && !initRef.current) {
      initRef.current = true;
      handleSync(user.uid);
    } else if (!user) {
      initRef.current = false;
      unsubscribeAll();
      setSyncStatus('idle');
    }

    return () => {
      if (!user) unsubscribeAll();
    };
  }, [user, handleSync, setSyncStatus]);

  return { syncStatus, showMergeDialog, handleMerge };
}
