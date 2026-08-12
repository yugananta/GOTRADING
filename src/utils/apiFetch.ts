// src/utils/apiFetch.ts
//
// All calls to the backend (/api/...) MUST go through this helper, not
// fetch() directly. The backend requires an `Authorization: Bearer <token>`
// header on almost every endpoint. Plain fetch() never sends it, so
// requests will always get 401 once the real backend is wired up. If
// there's no token yet (not logged in), the Authorization header is
// simply omitted — safe to use for public endpoints too (login, register, etc).
// Base URL for the backend API. When VITE_BACKEND_API_URL is defined (e.g. in
// Railway production), all relative paths are resolved against it so the
// frontend can talk to a backend running on a different domain/service. If
// it's not set, requests fall back to relative URLs (same-origin), which
// preserves the previous behavior for local development.
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL as string | undefined;

function resolveUrl(url: string): string {
  if (!BACKEND_API_URL) {
    return url;
  }
  // If the caller already passed an absolute URL, leave it untouched.
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const base = BACKEND_API_URL.replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
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
  return fetch(resolveUrl(url), { ...options, headers });
}
