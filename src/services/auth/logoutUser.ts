'use server';

import { serverFetch } from '@/helper/server-fetch';
import { deleteCookie } from './tokenHandlers';

export const logoutUser = async () => {
  try {
    // Call backend to invalidate refresh token
    await serverFetch.post('/auth/logout');
  } catch {
    // Continue logout even if API call fails
  }
  await deleteCookie('accessToken');
  await deleteCookie('refreshToken');
};
