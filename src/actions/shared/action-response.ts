export type ActionResponse<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errorType: 'VALIDATION_ERROR';
      errors: Record<string, string[]>;
      message: string;
    }
  | {
      success: false;
      errorType: 'CONCURRENCY_ERROR' | 'NOT_FOUND' | 'SYSTEM_ERROR';
      message: string;
    };
