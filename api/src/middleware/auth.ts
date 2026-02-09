import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ErrorResponses } from '../utils/response';
import prisma from '../lib/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Requires a valid JWT access token in the Authorization header
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ErrorResponses.unauthorized(res, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return ErrorResponses.unauthorized(res, 'Invalid or expired token');
    }

    // Check if it's an access token
    if (payload.type !== 'access') {
      return ErrorResponses.unauthorized(res, 'Invalid token type');
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, status: true, role: true },
    });

    if (!user) {
      return ErrorResponses.unauthorized(res, 'User not found');
    }

    if (user.status !== 'active') {
      return ErrorResponses.forbidden(res, 'Account is not active');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return ErrorResponses.internalError(res);
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload && payload.type === 'access') {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, status: true, role: true },
        });

        if (user && user.status === 'active') {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
}

/**
 * Role-based authorization middleware
 * Requires user to have one of the specified roles
 */
export function requireRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return ErrorResponses.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ErrorResponses.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
}
