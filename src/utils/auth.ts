import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
    try {
      return jwt.verify(token, REFRESH_SECRET) as { userId: string };
    } catch {
      return null;
    }
  };
