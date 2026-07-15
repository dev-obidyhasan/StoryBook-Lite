'use client';

import { useEffect, useState } from 'react';
import { tokenStore } from '@/helper/client-fetch';
import { getCookie, refreshAccessTokenAction } from '@/services/auth/tokenHandlers';
import type { UserInfo } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * useAuth — initialises access token on mount using server actions (same as TokenInitializer).
 *
 * Uses refreshAccessTokenAction() instead of a browser-side cross-site fetch because:
 * - Login stores tokens on the frontend domain (storybooklite.vercel.app) via server actions.
 * - The browser has no cookies for the backend domain, so direct /auth/refresh calls get 401.
 * - Server actions read from the Next.js cookie store (frontend domain) — no cross-site issue.
 */
export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Try to get a fresh access token via server action (avoids cross-site cookie issues)
        const token = await refreshAccessTokenAction()
          // 2. Fallback: use existing accessToken cookie if refresh isn't needed yet
          || await getCookie('accessToken');

        if (token) {
          tokenStore.set(token);
          // Decode JWT payload to get user info (server already verified the token)
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
          });
        } else {
          tokenStore.clear();
          setUser(null);
        }
      } catch {
        tokenStore.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: tokenStore.get()
          ? { Authorization: `Bearer ${tokenStore.get()}` }
          : {},
      });
    } finally {
      tokenStore.clear();
      setUser(null);
      window.location.href = '/login';
    }
  };

  return { user, isLoading, isAuthenticated: !!user, logout };
}

