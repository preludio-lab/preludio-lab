/**
 * ドメインサービスインターフェース: Logger
 *
 * アプリケーション内でのロギングのコントラクトを定義。
 * 依存性逆転の原則 (DIP) に対応。
 * ドメイン層はこのインターフェースにのみ依存し、Pino などの具体的な実装には依存しません。
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}
