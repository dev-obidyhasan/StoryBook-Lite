import { getCookie } from './tokenHandlers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { UserInfo } from '@/types';

export const getUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const accessToken = await getCookie('accessToken');
    if (!accessToken) return null;

    // Decode without verification (server-side — secret not exposed to client)
    // Verification happens on the backend on every API call.
    const decoded = jwt.decode(accessToken) as JwtPayload;
    if (!decoded || !decoded.userId) return null;

    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as UserInfo['role'],
    };
  } catch {
    return null;
  }
};
