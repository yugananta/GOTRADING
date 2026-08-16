import jwt from 'jsonwebtoken';

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.ACCESS_SECRET || 'fallback_access_secret';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || 'fallback_refresh_secret';

export interface UserTokenInfo {
  id?: string;
  userId?: string;
  sub?: string;
  email?: string;
  role?: string;
}

export const generateAccessToken = (userOrId: string | UserTokenInfo) => {
  const userId = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.userId || userOrId.sub || '');
  const email = typeof userOrId === 'object' ? userOrId.email : undefined;
  const role = typeof userOrId === 'object' ? userOrId.role : 'user';

  const payload: Record<string, any> = {
    userId,
    id: userId,
    sub: userId,
    role: role || 'user',
  };
  if (email) payload.email = email;

  return jwt.sign(payload, getAccessSecret(), { expiresIn: '15m' });
};

export const generateRefreshToken = (userOrId: string | UserTokenInfo) => {
  const userId = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.userId || userOrId.sub || '');
  return jwt.sign({ userId, sub: userId, id: userId }, getRefreshSecret(), { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, getAccessSecret()) as { userId: string; id?: string; sub?: string; email?: string; role?: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, getRefreshSecret()) as { userId: string; id?: string; sub?: string };
  } catch {
    return null;
  }
};
