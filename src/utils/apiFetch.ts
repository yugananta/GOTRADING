// src/utils/apiFetch.ts
//
// All calls to the backend (/api/...) MUST go through this helper, not
// fetch() directly. The backend requires an `Authorization: Bearer <token>`
// header on almost every endpoint. Plain fetch() never sends it, so
// requests will always get 401 once the real backend is wired up. If
// there's no token yet (not logged in), the Authorization header is
// simply omitted — safe to use for public endpoints too (login, register, etc).

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  const lang = localStorage.getItem('i18nextLng') || 'en';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // If 401 Unauthorized and not already calling auth endpoints
  if (res.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            const newToken = data.accessToken || data.token;
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
              isRefreshing = false;
              onRefreshed(newToken);

              // Retry original request with new token
              headers['Authorization'] = `Bearer ${newToken}`;
              return fetch(url, { ...options, headers });
            }
          }
        } catch (e) {
          console.error('Failed to auto-refresh access token:', e);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for active refresh to finish then retry
        return new Promise<Response>((resolve) => {
          addRefreshSubscriber((newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            resolve(fetch(url, { ...options, headers }));
          });
        });
      }
    }
  }

  return res;
}
