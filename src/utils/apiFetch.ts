// src/utils/apiFetch.ts
//
// All calls to the backend (/api/...) MUST go through this helper, not
// fetch() directly. The backend requires an `Authorization: Bearer <token>`
// header on almost every endpoint. Plain fetch() never sends it, so
// requests will always get 401 once the real backend is wired up. If
// there's no token yet (not logged in), the Authorization header is
// simply omitted — safe to use for public endpoints too (login, register, etc).
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
  return fetch(url, { ...options, headers });
}
