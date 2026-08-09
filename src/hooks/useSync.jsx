import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTaskStore } from '../stores/taskStore';
import { useNoteStore } from '../stores/noteStore';
import { useProjectStore } from '../stores/projectStore';
import { useListStore } from '../stores/listStore';
import { useTagStore } from '../stores/tagStore';
import {
  pushAll, pullAll, subscribeToChanges, unsubscribeAll, mergeData, COLLECTIONS,
} from '../lib/syncEngine';

const STORE_MAP = {
  tasks: { useStore: useTaskStore, getItems: s => s.tasks, setItems: 'setState' },
  notes: { useStore: useNoteStore, getItems: s => s.notes, setItems: 'setState' },
  projects: { useStore: useProjectStore, getItems: s => s.projects, setItems: 'setState' },
  lists: { useStore: useListStore, getItems: s => s.lists, setItems: 'setState' },
  tags: { useStore: useTagStore, getItems: s => s.tags, setItems: 'setState' },
};

/**
 * Hook that manages sync lifecycle:
 * - On login: offers to merge local + cloud data
 * - While logged in: subscribes to real-time changes
 * - On logout: unsubscribes
 */
export function useSync() {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeData_, setMergeData_] = useState(null);

  // Check if this is first login (no cloud data yet)
  const handleFirstLogin = useCallback(async (uid) => {
    setSyncStatus('syncing');
    try {
      // Pull cloud data for all stores
      const cloudData = {};
      let hasCloudData = false;
      for (const name of COLLECTIONS) {
        const items = await pullAll(uid, name);
        cloudData[name] = items;
        if (items.length > 0) hasCloudData = true;
      }

      // Get local data
      const localData = {};
      let hasLocalData = false;
      for (const [name, config] of Object.entries(STORE_MAP)) {
        const items = config.getItems(config.useStore.getState());
        localData[name] = items;
        if (items.length > 0) hasLocalData = true;
      }

      if (hasCloudData && hasLocalData) {
        // Both have data — show merge dialog
        setMergeData_({ localData, cloudData });
        setShowMergeDialog(true);
        setSyncStatus('idle');
      } else if (hasLocalData && !hasCloudData) {
        // First time: push local to cloud
        for (const [name, items] of Object.entries(localData)) {
          if (items.length > 0) await pushAll(uid, name, items);
        }
        setSyncStatus('synced');
        startRealtimeSync(uid);
      } else if (hasCloudData && !hasLocalData) {
        // Has cloud data but nothing local — pull from cloud
        applyCloudData(cloudData);
        setSyncStatus('synced');
        startRealtimeSync(uid);
      } else {
        // Both empty — nothing to do
        setSyncStatus('synced');
        startRealtimeSync(uid);
      }
    } catch (err) {
      console.error('[Sync] First login error:', err);
      setSyncStatus('error');
    }
  }, []);

  // Apply merge decision
  const handleMerge = useCallback(async (decision) => {
    if (!user || !mergeData_) return;
    setSyncStatus('syncing');
    setShowMergeDialog(false);

    try {
      const { localData, cloudData } = mergeData_;

      if (decision === 'merge') {
        // Merge both datasets
        for (const name of COLLECTIONS) {
          const merged = mergeData(localData[name] || [], cloudData[name] || []);
          // Update local store
          STORE_MAP[name].useStore.setState({ [name]: merged });
          // Push merged to cloud
          await pushAll(user.uid, name, merged);
        }
      } else if (decision === 'cloud') {
        // Prefer cloud data
        applyCloudData(cloudData);
      } else if (decision === 'local') {
        // Prefer local data, overwrite cloud
        for (const [name, items] of Object.entries(localData)) {
          await pushAll(user.uid, name, items);
        }
      }

      setSyncStatus('synced');
      startRealtimeSync(user.uid);
    } catch (err) {
      console.error('[Sync] Merge error:', err);
      setSyncStatus('error');
    }

    setMergeData_(null);
  }, [user, mergeData_]);

  // Start real-time listeners for all stores
  const startRealtimeSync = useCallback((uid) => {
    for (const [name, config] of Object.entries(STORE_MAP)) {
      subscribeToChanges(uid, name, (remoteItems) => {
        // Only update if the remote data is different
        const currentItems = config.getItems(config.useStore.getState());
        if (JSON.stringify(currentItems) !== JSON.stringify(remoteItems)) {
          config.useStore.setState({ [name]: remoteItems });
        }
      });
    }
  }, []);

  // Apply cloud data to local stores
  const applyCloudData = useCallback((cloudData) => {
    for (const [name, items] of Object.entries(cloudData)) {
      if (STORE_MAP[name] && items.length > 0) {
        STORE_MAP[name].useStore.setState({ [name]: items });
      }
    }
  }, []);

  // React to auth changes
  useEffect(() => {
    if (user) {
      handleFirstLogin(user.uid);
    } else {
      unsubscribeAll();
      setSyncStatus('idle');
    }

    return () => unsubscribeAll();
  }, [user, handleFirstLogin]);

  return {
    syncStatus,
    showMergeDialog,
    handleMerge,
  };
}
