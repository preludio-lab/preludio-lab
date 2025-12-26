import pino from 'pino';
import { ILogger } from '@/domain/shared/logger';

/**
 * Infrastructure Implementation: Pino Logger
 * 
 * Concrete implementation of ILogger using Pino.
 * Should be used primarily in Server Components and Server Actions.
 */
export class PinoLogger implements ILogger {
    private logger: pino.Logger;

    constructor() {
        // Configuration:
        // - Development: Pretty print for readability
        // - Production: JSON for observability
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info', // Default to info
        });
    }

    debug(message: string, meta?: Record<string, unknown>) {
        this.logger.debug(meta, message);
    }

    info(message: string, meta?: Record<string, unknown>) {
        this.logger.info(meta, message);
    }

    warn(message: string, meta?: Record<string, unknown>) {
        this.logger.warn(meta, message);
    }

    error(message: string, error?: Error, meta?: Record<string, unknown>) {
        // Ensure error object is merged into the log object for structured parsing
        this.logger.error({ ...meta, err: error }, message);
    }
}
