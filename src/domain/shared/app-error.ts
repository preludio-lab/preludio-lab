export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INFRASTRUCTURE_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'CONCURRENCY_ERROR';

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

/**
 * インフラ層固有のエラー
 * ネットワーク瞬断やタイムアウトなど、一時的な問題（isTransient）を表現できる。
 */
export class InfrastructureError extends AppError {
  constructor(
    message: string,
    public readonly isTransient: boolean = false,
    cause?: Error | unknown,
    status: number = 500,
  ) {
    super(message, 'INFRASTRUCTURE_ERROR', status, cause);
    this.name = 'InfrastructureError';
  }
}
