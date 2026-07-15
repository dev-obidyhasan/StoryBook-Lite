"use server";

import { cookies } from "next/headers";

type CookieOptions = {
  secure?: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  domain?: string;
  expires?: Date;
};

export const setCookie = async (
  key: string,
  value: string,
  options: CookieOptions,
) => {
  const cookieStore = await cookies();
  cookieStore.set(key, value, options);
};

export const getCookie = async (key: string) => {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value || null;
};

export const deleteCookie = async (key: string) => {
  const cookieStore = await cookies();
  cookieStore.delete(key);
};

export const refreshAccessTokenAction = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) return null;

    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    if (res.ok) {
      const json = await res.json();
      const newToken = json?.data?.accessToken;
      if (newToken) {
        cookieStore.set("accessToken", newToken, {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 60 * 60 * 24, // 24 hours
          path: "/",
          sameSite: "lax",
        });
        return newToken;
      }
    }
  } catch (e) {
    console.error("Server action token refresh error:", e);
  }

  return null;
};
