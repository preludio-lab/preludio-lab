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
    }
  | {
      success: false;
      errorType: 'CONSTRAINT_ERROR';
      message: string;
      /** Affected entity IDs (e.g. WorkPart IDs that cannot be deleted) */
      constraintDetails: { entityId: string; entityType: string }[];
    };
