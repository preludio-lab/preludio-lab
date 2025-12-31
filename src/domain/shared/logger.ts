/**
 * Domain Service Interface: Logger
 *
 * Defines the contract for logging within the application.
 * Corresponds to the Dependency Inversion Principle (DIP).
 * Domain layer depends only on this interface, not on Pino.
 */
export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}
