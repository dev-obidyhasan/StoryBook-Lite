'use client';

import { useEffect, useRef, useState } from 'react';
import { tokenStore } from '@/helper/client-fetch';
import { getCookie, refreshAccessTokenAction } from '@/services/auth/tokenHandlers';

/**
 * TokenInitializer — silently initialises the in-memory access token on mount.
 *
 * Strategy:
 *  1. Try POST /auth/refresh with the httpOnly refreshToken cookie (server action).
 *  2. On success  → store the fresh accessToken in tokenStore and render children.
 *  3. On failure  → fall back to the existing accessToken cookie (still valid from login).
 *  4. If neither  → render children anyway; each page's 401 → client-fetch will retry
 *                   refresh one more time, then redirect to /login if truly expired.
 *
 * CRITICAL: NEVER delete the accessToken here. The user may have just logged in and
 * the accessToken is valid even if the refresh call temporarily fails (e.g. network
 * hiccup, Redis offline). Deleting it causes a redirect loop.
 *
 * NEVER hard-redirect here either: if the middleware sees a valid accessToken cookie
 * it will redirect /login → /orders, creating an infinite loop.
 */
export function TokenInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React StrictMode
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const init = async () => {
      try {
        // 1. Try to get a fresh token via the refresh server action
        const freshToken = await refreshAccessTokenAction();
        if (freshToken) {
          tokenStore.set(freshToken);
          return;
        }

        // 2. Refresh failed or returned null — try to use the existing accessToken
        //    cookie directly (it was set on login and may still be valid).
        const existingToken = await getCookie('accessToken');
        if (existingToken) {
          tokenStore.set(existingToken);
          return;
        }

        // 3. No tokens available — session truly expired.
        //    Don't redirect here; let API call 401s handle the redirect gracefully.
        tokenStore.clear();
      } catch {
        // Network or unexpected error — proceed silently.
        // Individual API calls will retry refresh and redirect if truly expired.
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  if (!ready) {
    // Loading skeleton — matches the page layout to avoid layout shift
    return (
      <div className="flex-1 p-6">
        <div className="space-y-4 animate-pulse max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-secondary rounded-xl w-40" />
              <div className="h-4 bg-secondary/60 rounded-xl w-64" />
            </div>
            <div className="h-10 bg-secondary rounded-xl w-28" />
          </div>
          <div className="h-10 bg-secondary rounded-xl w-full mt-2" />
          <div className="space-y-2 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-[60px] bg-card border border-border/50 rounded-xl"
                style={{ opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
