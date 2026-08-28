import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types.ts';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[Auth Middleware 401] No token provided in Authorization header');
    return res.status(401).json({ success: false, data: null, error: { code: 'AUTH_INVALID_TOKEN', message: 'No token provided' } } as ApiResponse);
  }

  const tokenSnippet = token.substring(0, 20);

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch (err: any) {
    const reason = `${err?.name || 'Error'}: ${err?.message || String(err)}`;
    console.error(`[Auth Middleware 401] Invalid or expired token. Token snippet: "${tokenSnippet}...", Reason: ${reason}`);
    return res.status(401).json({ success: false, data: null, error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' } } as ApiResponse);
  }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Need to check user role, but for now we only have userId in request.
        // Assuming we will populate req.user later.
        next();
    }
};
