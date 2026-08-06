import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.ts';
import { ApiResponse } from '../types.ts';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, data: null, error: { code: 'AUTH_INVALID_TOKEN', message: 'No token provided' } } as ApiResponse);
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, data: null, error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' } } as ApiResponse);
  }

  (req as any).userId = payload.userId;
  next();
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Need to check user role, but for now we only have userId in request.
        // Assuming we will populate req.user later.
        next();
    }
};
