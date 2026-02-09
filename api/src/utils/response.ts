import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send a successful API response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error API response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, string[]>
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a paginated API response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  notFound: (res: Response, resource: string = 'Resource') =>
    sendError(res, 'NOT_FOUND', `${resource} not found`, 404),

  unauthorized: (res: Response, message: string = 'Unauthorized') =>
    sendError(res, 'UNAUTHORIZED', message, 401),

  forbidden: (res: Response, message: string = 'Forbidden') =>
    sendError(res, 'FORBIDDEN', message, 403),

  badRequest: (res: Response, message: string, details?: Record<string, string[]>) =>
    sendError(res, 'BAD_REQUEST', message, 400, details),

  validationError: (res: Response, details: Record<string, string[]>) =>
    sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, details),

  internalError: (res: Response, message: string = 'Internal server error') =>
    sendError(res, 'INTERNAL_ERROR', message, 500),

  conflict: (res: Response, message: string) =>
    sendError(res, 'CONFLICT', message, 409),

  tooManyRequests: (res: Response) =>
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429),
};

/**
 * Common success responses
 */
export const SuccessResponses = {
  ok: <T>(res: Response, data: T) => sendSuccess(res, data, 200),
  created: <T>(res: Response, data: T) => sendSuccess(res, data, 201),
  noContent: (res: Response) => res.status(204).send(),
};

/**
 * Simplified helper functions for cleaner route code
 */
export function success<T>(res: Response, data: T, statusCode: number = 200): Response {
  return sendSuccess(res, data, statusCode);
}

export function created<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

export function notFound(res: Response, message: string = 'Resource not found'): Response {
  return sendError(res, 'NOT_FOUND', message, 404);
}

export function badRequest(res: Response, message: string, details?: Record<string, string[]>): Response {
  return sendError(res, 'BAD_REQUEST', message, 400, details);
}

export function unauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return sendError(res, 'UNAUTHORIZED', message, 401);
}

export function forbidden(res: Response, message: string = 'Forbidden'): Response {
  return sendError(res, 'FORBIDDEN', message, 403);
}
