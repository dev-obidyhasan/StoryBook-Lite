'use client';

import { setCookie, deleteCookie, refreshAccessTokenAction } from '@/services/auth/tokenHandlers';

/**
 * Client-side API fetch helper.
 * - Auto-attaches Authorization: Bearer <token> from in-memory store.
 * - On 401: attempts token refresh via /auth/refresh, retries once.
 * - On refresh failure: redirects to /login.
 *
 * Usage:
 *   const data = await clientFetch.get<Order[]>('/orders');
 *   const order = await clientFetch.post<Order>('/orders', { body: formData });
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── In-memory token store ────────────────────────────────────────
// JWT stored in memory (not localStorage) for security.
// Refreshed on page load via the /auth/refresh endpoint.
let _accessToken: string | null = null;
let _refreshing: Promise<boolean> | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

// ─── Core fetch function ──────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const { headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // Only add Content-Type for non-FormData requests
  if (!(restOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...restOptions,
    headers,
    credentials: 'include', // Send refresh token cookie automatically
  });

  // Handle 401 — attempt refresh once
  if (response.status === 401 && retry) {
    const refreshed = await _attemptRefresh();
    if (refreshed) {
      return apiFetch<T>(endpoint, options, false); // Retry once
    } else {
      _redirectToLogin();
      throw new Error('Session expired. Redirecting to login.');
    }
  }

  const json = await response.json();

  if (!response.ok) {
    const errorMsg =
      json?.error?.message || json?.message || `HTTP ${response.status}`;
    const error = new Error(errorMsg) as Error & { code?: string; status?: number };
    error.code = json?.error?.code;
    error.status = response.status;
    throw error;
  }

  return json as T;
}

// ─── Token refresh ────────────────────────────────────────────────
async function _attemptRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh calls
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    try {
      const newToken = await refreshAccessTokenAction();
      if (newToken) {
        _accessToken = newToken;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
}

async function _redirectToLogin() {
  _accessToken = null;
  try {
    await deleteCookie('accessToken');
    await deleteCookie('refreshToken');
  } catch (cookieErr) {
    console.error('Failed to delete tokens from cookies:', cookieErr);
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

// ─── Public API ───────────────────────────────────────────────────
export const clientFetch = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST' }),

  patch: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH' }),

  put: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT' }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
