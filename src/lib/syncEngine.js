import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sync Engine — bridges Zustand localStorage stores with Firestore
 * 
 * Architecture:
 *   Zustand store → localStorage (always, immediate)
 *                 → Firestore (if logged in, debounced)
 *   Firestore onSnapshot → Zustand store (real-time remote changes)
 * 
 * Conflict resolution: last-write-wins via `updatedAt` timestamp
 */

const DEBOUNCE_MS = 500;
const debounceTimers = {};
const activeListeners = {};

// Collection names for each store
const COLLECTIONS = ['tasks', 'notes', 'projects', 'lists', 'tags'];

/**
 * Get Firestore collection ref for a user's data
 */
function userCollection(uid, storeName) {
  return collection(db, 'users', uid, storeName);
}

/**
 * Push a single item to Firestore (debounced)
 */
export function pushItem(uid, storeName, item) {
  if (!uid || !item?.id) return;

  const key = `${storeName}:${item.id}`;
  clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(async () => {
    try {
      const ref = doc(db, 'users', uid, storeName, item.id);
      await setDoc(ref, { ...item, _syncedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.error(`[Sync] Failed to push ${storeName}/${item.id}:`, err);
    }
  }, DEBOUNCE_MS);
}

/**
 * Delete an item from Firestore
 */
export async function deleteItem(uid, storeName, itemId) {
  if (!uid || !itemId) return;
  try {
    const ref = doc(db, 'users', uid, storeName, itemId);
    await deleteDoc(ref);
  } catch (err) {
    console.error(`[Sync] Failed to delete ${storeName}/${itemId}:`, err);
  }
}

/**
 * Pull all data from Firestore for a store
 */
export async function pullAll(uid, storeName) {
  if (!uid) return [];
  try {
    const snap = await getDocs(userCollection(uid, storeName));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.error(`[Sync] Failed to pull ${storeName}:`, err);
    return [];
  }
}

/**
 * Push all local items to Firestore (batch write)
 */
export async function pushAll(uid, storeName, items) {
  if (!uid || !items?.length) return;
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const ref = doc(db, 'users', uid, storeName, item.id);
      batch.set(ref, { ...item, _syncedAt: Date.now() }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error(`[Sync] Failed to push all ${storeName}:`, err);
  }
}

/**
 * Subscribe to real-time changes from Firestore
 * Returns an unsubscribe function
 */
export function subscribeToChanges(uid, storeName, onUpdate) {
  if (!uid) return () => {};

  // Unsubscribe any existing listener for this store
  if (activeListeners[storeName]) {
    activeListeners[storeName]();
  }

  const unsubscribe = onSnapshot(
    userCollection(uid, storeName),
    (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data = d.data();
        // Remove internal sync fields before passing to store
        const { _syncedAt, ...item } = data;
        return { ...item, id: d.id };
      });
      onUpdate(items);
    },
    (err) => {
      console.error(`[Sync] Listener error for ${storeName}:`, err);
    }
  );

  activeListeners[storeName] = unsubscribe;
  return unsubscribe;
}

/**
 * Unsubscribe all active listeners
 */
export function unsubscribeAll() {
  Object.values(activeListeners).forEach(unsub => unsub?.());
  Object.keys(activeListeners).forEach(key => delete activeListeners[key]);
  // Clear any pending debounce timers
  Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
  Object.keys(debounceTimers).forEach(key => delete debounceTimers[key]);
}

/**
 * Merge local and cloud data — used on first login
 * Strategy: union of both sets, cloud wins on conflicts (same ID, newer updatedAt)
 */
export function mergeData(localItems, cloudItems) {
  const merged = new Map();

  // Add all cloud items first
  cloudItems.forEach(item => merged.set(item.id, item));

  // Add local items — only if not in cloud, or if local is newer
  localItems.forEach(item => {
    const cloudItem = merged.get(item.id);
    if (!cloudItem) {
      // Local-only item, add it
      merged.set(item.id, item);
    } else if ((item.updatedAt || 0) > (cloudItem.updatedAt || 0)) {
      // Local is newer, prefer it
      merged.set(item.id, item);
    }
    // Otherwise cloud version wins (already in map)
  });

  return Array.from(merged.values());
}

export { COLLECTIONS };
