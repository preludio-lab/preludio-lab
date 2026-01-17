export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'INFRASTRUCTURE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCode,
    public readonly status: number = 500,
    public readonly cause?: Error | unknown,
  ) {
    super(message);
    this.name = 'AppError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
