'use client';

import { useEffect, useState } from 'react';
import { tokenStore } from '@/helper/client-fetch';
import type { UserInfo } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * useAuth — initialises access token in memory on mount by calling /auth/refresh.
 * The refresh token lives in an httpOnly cookie, so this is safe.
 * Returns current user info decoded from the token.
 */
export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Refresh to get a fresh access token on every page load
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          const json = await res.json();
          const token: string = json?.data?.accessToken;
          if (token) {
            tokenStore.set(token);
            // Decode JWT payload (no verification needed — server already verified)
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              userId: payload.userId,
              email: payload.email,
              role: payload.role,
            });
          }
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
