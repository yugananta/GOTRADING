import { apiFetch } from './apiFetch';

const DB_NAME = 'tarapti-offline';
const STORE_NAME = 'interactions';

export interface OfflineInteraction {
  id: string; // type_postId_userId
  type: 'like' | 'bookmark';
  postId: string;
  userId: string;
  timestamp: number;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function saveOfflineInteraction(type: 'like' | 'bookmark', postId: string, userId: string): Promise<void> {
  try {
    const db = await openDB();
    const id = `${type}_${postId}_${userId}`;
    const item: OfflineInteraction = { id, type, postId, userId, timestamp: Date.now() };
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve();
        // Register Service Worker Background Sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((registration: any) => {
            return registration.sync.register('sync-interactions');
          }).then(() => {
            console.log('Background Sync registered successfully');
          }).catch((err) => {
            console.warn('Background Sync registration failed, falling back to manual: ', err);
          });
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save offline interaction:', error);
  }
}

export async function getOfflineInteractions(): Promise<OfflineInteraction[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to read offline interactions:', error);
    return [];
  }
}

export async function deleteOfflineInteraction(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete offline interaction:', error);
  }
}

// Fallback main thread online sync
export async function syncPendingInteractionsOnline(onSuccessCallback?: () => void): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  const interactions = await getOfflineInteractions();
  if (interactions.length === 0) return false;
  
  console.log(`[Main Thread Sync] Found ${interactions.length} pending offline interactions...`);
  let updatedAny = false;
  
  for (const item of interactions) {
    const url = `/api/posts/${item.postId}/${item.type}`;
    try {
      const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: item.userId })
      });
      
      if (response.ok) {
        await deleteOfflineInteraction(item.id);
        updatedAny = true;
        console.log(`[Main Thread Sync] Synced ${item.type} for post ${item.postId}`);
      }
    } catch (err) {
      console.error(`[Main Thread Sync] Failed to sync ${item.id}:`, err);
    }
  }
  
  if (updatedAny && onSuccessCallback) {
    onSuccessCallback();
  }
  
  return updatedAny;
}
