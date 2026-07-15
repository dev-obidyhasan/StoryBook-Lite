'use server';

import { serverFetch } from '@/helper/server-fetch';
import { setCookie } from './tokenHandlers';

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: { accessToken: string; user: { id: string; email: string; role: string } };
  error?: { code: string; message: string };
}

export async function loginUser(userData: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  try {
    const response = await serverFetch.post('/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    // If login failed, normalize the error message.
    // Backend error format: { success: false, error: { code, message } }
    if (!result?.success) {
      return {
        success: false,
        message:
          result?.error?.message ||
          result?.message ||
          'Login failed. Please check your credentials.',
      };
    }

    // Success: store access token in httpOnly cookie
    const accessToken = result?.data?.accessToken || null;
    if (accessToken) {
      await setCookie('accessToken', accessToken, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
        sameSite: 'lax',
      });
    }

    // Success: extract and store refresh token in httpOnly cookie
    let refreshToken: string | null = null;
    if (typeof response.headers.getSetCookie === 'function') {
      const setCookies = response.headers.getSetCookie();
      for (const cookieStr of setCookies) {
        const match = cookieStr.match(/refreshToken=([^;]+)/);
        if (match) {
          refreshToken = match[1];
          break;
        }
      }
    } else {
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const match = setCookieHeader.match(/refreshToken=([^;]+)/);
        if (match) {
          refreshToken = match[1];
        }
      }
    }

    if (refreshToken) {
      await setCookie('refreshToken', refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
      });
    }

    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong';
    return {
      success: false,
      message:
        process.env.NODE_ENV === 'development'
          ? message
          : 'Unable to connect. Please check your network and try again.',
    };
  }
}
