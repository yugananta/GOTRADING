export const DB_NAME = 'tarapti-cache-db';
export const POSTS_STORE_NAME = 'posts_cache';

export function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(POSTS_STORE_NAME)) {
        db.createObjectStore(POSTS_STORE_NAME, { keyPath: 'id' }); // Use a fixed id like 'main_feed'
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

export async function savePostsToCache(posts: any[]): Promise<void> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(POSTS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(POSTS_STORE_NAME);
      const request = store.put({ id: 'main_feed', data: posts, timestamp: Date.now() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to save posts to IndexedDB:", err);
  }
}

export async function getPostsFromCache(): Promise<any[] | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(POSTS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(POSTS_STORE_NAME);
      const request = store.get('main_feed');
      
      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to get posts from IndexedDB:", err);
    return null;
  }
}
