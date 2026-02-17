import type { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  } as ApiResponse<T>);
}

export function sendError(res: Response, error: string, statusCode = 400): void {
  res.status(statusCode).json({
    success: false,
    error,
  } as ApiResponse);
}

export function sendMessage(res: Response, message: string, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    message,
  } as ApiResponse);
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}
