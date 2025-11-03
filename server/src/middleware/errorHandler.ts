/**
 * Centralized error handling middleware
 * Catches all errors and formats them consistently for the client
 */

import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handling middleware
 * Should be mounted last in the middleware chain
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Log error details internally
  console.error("[Error Handler]", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Determine status code and message
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/**
 * Async route wrapper to catch promise rejections
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }))
 */
export function catchAsync(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
