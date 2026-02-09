/**
 * Custom API Error class
 */
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Common error factory functions
export const Errors = {
  // 400 Bad Request
  badRequest: (message = 'Bad request', details?: Record<string, unknown>) =>
    new APIError(message, 400, 'BAD_REQUEST', details),

  // 401 Unauthorized
  unauthorized: (message = 'Unauthorized') =>
    new APIError(message, 401, 'UNAUTHORIZED'),

  // 403 Forbidden
  forbidden: (message = 'Forbidden') =>
    new APIError(message, 403, 'FORBIDDEN'),

  // 404 Not Found
  notFound: (resource = 'Resource') =>
    new APIError(`${resource} not found`, 404, 'NOT_FOUND'),

  // 409 Conflict
  conflict: (message = 'Resource already exists') =>
    new APIError(message, 409, 'CONFLICT'),

  // 422 Unprocessable Entity
  validation: (message = 'Validation failed', details?: Record<string, unknown>) =>
    new APIError(message, 422, 'VALIDATION_ERROR', details),

  // 429 Too Many Requests
  tooManyRequests: (message = 'Too many requests') =>
    new APIError(message, 429, 'RATE_LIMIT_EXCEEDED'),

  // 500 Internal Server Error
  internal: (message = 'Internal server error') =>
    new APIError(message, 500, 'INTERNAL_ERROR'),

  // 503 Service Unavailable
  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new APIError(message, 503, 'SERVICE_UNAVAILABLE'),
};
