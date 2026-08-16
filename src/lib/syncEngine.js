import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sync Engine v2 — Tombstone-aware sync
 * 
 * Architecture:
 *   Zustand store → localStorage (always, immediate)
 *                 → Firestore (if logged in, debounced)
 *   Firestore onSnapshot → Zustand store (real-time remote changes)
 * 
 * Conflict resolution: last-write-wins via `updatedAt` timestamp
 * Deletion tracking: tombstones in `users/{uid}/tombstones/{itemId}`
 */

const DEBOUNCE_MS = 500;
const TOMBSTONE_TTL_DAYS = 30;
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
 * Get Firestore collection ref for tombstones
 */
function tombstoneCollection(uid) {
  return collection(db, 'users', uid, 'tombstones');
}

// ─── Tombstone CRUD ─────────────────────────────────────────────

/**
 * Create a tombstone when permanently deleting an item.
 * Records: which item, from which collection, when deleted.
 */
export async function createTombstone(uid, storeName, itemId) {
  if (!uid || !itemId) return;
  try {
    const ref = doc(db, 'users', uid, 'tombstones', itemId);
    await setDoc(ref, {
      id: itemId,
      collection: storeName,
      deletedAt: Date.now(),
    });
    console.log(`[Sync] Tombstone created: ${storeName}/${itemId}`);
  } catch (err) {
    console.error(`[Sync] Failed to create tombstone ${storeName}/${itemId}:`, err);
  }
}

/**
 * Fetch all tombstones for a user
 */
export async function getTombstones(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(tombstoneCollection(uid));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.error('[Sync] Failed to fetch tombstones:', err);
    return [];
  }
}

/**
 * Remove tombstones older than TOMBSTONE_TTL_DAYS
 */
export async function cleanOldTombstones(uid) {
  if (!uid) return;
  try {
    const cutoff = Date.now() - (TOMBSTONE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const snap = await getDocs(tombstoneCollection(uid));
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.deletedAt && data.deletedAt < cutoff) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
      console.log(`[Sync] Cleaned ${count} old tombstones`);
    }
  } catch (err) {
    console.error('[Sync] Failed to clean tombstones:', err);
  }
}

// ─── Push / Pull / Delete ───────────────────────────────────────

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
 * Delete an item from Firestore AND create a tombstone
 */
export async function deleteItem(uid, storeName, itemId) {
  if (!uid || !itemId) return;
  try {
    // Create tombstone FIRST (so even if delete fails, tombstone exists)
    await createTombstone(uid, storeName, itemId);
    // Then delete the actual document
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
    // Firestore batch limit is 500, split if needed
    const batchSize = 450;
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach(item => {
        const ref = doc(db, 'users', uid, storeName, item.id);
        batch.set(ref, { ...item, _syncedAt: Date.now() }, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error(`[Sync] Failed to push all ${storeName}:`, err);
  }
}

// ─── Real-time Listeners ────────────────────────────────────────

/**
 * Subscribe to real-time changes from Firestore
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
  Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
  Object.keys(debounceTimers).forEach(key => delete debounceTimers[key]);
}

// ─── Merge Logic (Tombstone-Aware) ──────────────────────────────

/**
 * Merge local and cloud data with tombstone awareness.
 * 
 * Rules:
 *   1. Items in BOTH → newer updatedAt wins
 *   2. Item only in cloud → add to result (new from another device)
 *   3. Item only in local:
 *      a. If tombstone exists with deletedAt > item.updatedAt → SKIP (deleted elsewhere)
 *      b. If no tombstone → add to result (genuinely new local item)
 * 
 * @param {Array} localItems - items from localStorage
 * @param {Array} cloudItems - items from Firestore
 * @param {Array} tombstones - deletion records from Firestore
 * @param {string} collectionName - which collection we're merging (for tombstone filtering)
 * @returns {Array} merged items
 */
export function mergeData(localItems, cloudItems, tombstones = [], collectionName = '') {
  const merged = new Map();

  // Build tombstone lookup (only for this collection)
  const tombstoneMap = new Map();
  tombstones
    .filter(t => !collectionName || t.collection === collectionName)
    .forEach(t => tombstoneMap.set(t.id, t));

  // Add all cloud items first (they exist in Firestore, so they're valid)
  cloudItems.forEach(item => merged.set(item.id, item));

  // Process local items
  localItems.forEach(item => {
    const cloudItem = merged.get(item.id);
    const tombstone = tombstoneMap.get(item.id);

    if (tombstone) {
      // This item was deleted on another device
      if ((item.updatedAt || 0) > tombstone.deletedAt) {
        // Local item was edited AFTER deletion — user intentionally re-created/edited it
        // This is extremely rare but we should respect the user's intent
        merged.set(item.id, item);
      }
      // Otherwise: deleted after last edit → skip (don't resurrect)
      return;
    }

    if (!cloudItem) {
      // Local-only item with no tombstone → genuinely new
      merged.set(item.id, item);
    } else if ((item.updatedAt || 0) > (cloudItem.updatedAt || 0)) {
      // Local is newer than cloud → prefer local
      merged.set(item.id, item);
    }
    // Otherwise cloud version wins (already in map)
  });

  return Array.from(merged.values());
}

export { COLLECTIONS };
