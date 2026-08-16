// src/utils/apiFetch.ts
//
// All calls to the backend (/api/...) MUST go through this helper, not
// fetch() directly. The backend requires an `Authorization: Bearer <token>`
// header on almost every endpoint.
//
// Features:
// 1. Proactive auto-refresh: If access token is missing or expires within < 2 minutes (120s),
//    it automatically calls /api/auth/refresh before making the request.
// 2. Concurrency-safe: Multiple in-flight requests share a single refresh promise.
// 3. Reactive retry on 401: Attempts a refresh and retries the request once before failing.

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = typeof atob === 'function'
      ? decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      : typeof Buffer !== 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf-8')
      : null;

    if (!jsonPayload) return null;
    const payload = JSON.parse(jsonPayload);
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string, bufferSeconds: number = 120): boolean {
  const exp = parseJwtExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return (exp - now) < bufferSeconds;
}

let activeRefreshPromise: Promise<string | null> | null = null;

export async function refreshAuthToken(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      if (typeof window === 'undefined') return null;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      console.log('[apiFetch] Proactively refreshing access token...');
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.warn('[apiFetch] Refresh token endpoint returned status:', res.status);
        return null;
      }

      const data = await res.json();
      const newToken = data.token || data.accessToken;
      if (newToken) {
        localStorage.setItem('accessToken', newToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        console.log('[apiFetch] Access token successfully refreshed and saved.');
        return newToken;
      }
      return null;
    } catch (err) {
      console.warn('[apiFetch] Error refreshing access token:', err);
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const isAuthEndpoint =
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/check-availability');

  let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

  // 1. Proactive auto-refresh if token is missing, already expired, or expiring in < 2 minutes (120s)
  if (!isAuthEndpoint && refreshToken && (!token || isTokenExpiringSoon(token, 120))) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      token = refreshed;
    }
  }

  const lang = (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null) || 'en';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (!isAuthEndpoint) {
    console.warn(`[apiFetch] WARN: Sending request to ${url} without Authorization Bearer token! (accessToken was null)`);
  }

  let response = await fetch(url, { ...options, headers });

  // 2. Reactive retry on 401 if refresh token is available and wasn't an auth endpoint
  if (response.status === 401 && !isAuthEndpoint && refreshToken) {
    console.warn(`[apiFetch] 401 Unauthorized for ${url}. Attempting token refresh & retry...`);
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}
