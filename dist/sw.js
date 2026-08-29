const CACHE_NAME = 'tarapti-v4';
const ASSETS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'
];

// IndexedDB parameters matching the main thread configuration
const DB_NAME = 'tarapti-offline';
const STORE_NAME = 'interactions';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function getOfflineInteractions() {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteOfflineInteraction(id) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Failed to pre-cache some assets during install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Do not intercept non-GET requests, socket connections, or api calls
  if (req.method !== 'GET' || req.url.includes('/api/') || req.url.includes('/socket.io/')) {
    return;
  }

  // For HTML documents/navigations, ALWAYS fetch from network first so new deployment index.html is loaded
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('/')))
    );
    return;
  }

  // Network-First for JS and CSS assets to prevent caching stale HTML as script
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const contentType = networkResponse.headers.get('content-type') || '';
          // Only cache valid asset types; never cache HTML as JS/CSS
          if (req.url.includes('/assets/') && contentType.includes('text/html')) {
            return networkResponse;
          }
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Network error and asset not cached', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Tarapti Notification', body: 'New updates on Tarapti!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Tarapti Notification', body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/tarapti_logo_1784421680053.jpg',
      badge: '/tarapti_logo_1784421680053.jpg',
      vibrate: [150, 100, 150],
      sound: 'default'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// BACKGROUND SYNC EVENT
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-interactions') {
    event.waitUntil(syncInteractions());
  }
});

async function syncInteractions() {
  try {
    const interactions = await getOfflineInteractions();
    if (!interactions || interactions.length === 0) return;

    console.log(`[Service Worker] Syncing ${interactions.length} pending interactions...`);
    let syncedAny = false;

    for (const item of interactions) {
      const url = `/api/posts/${item.postId}/${item.type}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: item.userId })
        });
        
        if (response.ok) {
          await deleteOfflineInteraction(item.id);
          syncedAny = true;
          console.log(`[Service Worker] Successfully synced offline ${item.type} for post ${item.postId}`);
        }
      } catch (err) {
        console.error(`[Service Worker] Failed to sync interaction ${item.id}:`, err);
        // Do not delete from database, let it retry on next sync event
      }
    }

    if (syncedAny) {
      // Notify active client tabs to refresh their post feeds
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        client.postMessage({ type: 'INTERACTIONS_SYNCED' });
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error inside syncInteractions:', err);
  }
}
