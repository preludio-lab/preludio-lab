import { Logger } from '@/shared/logging/logger';
import { PinoLogger } from './pino.logger';

// アプリケーション全体で共有されるサーバーサイドロガーのインスタンス (Singleton)
// 将来的にロギングライブラリを変更する場合は、このファイルでインスタンス化するクラスを差し替えます。
const pinoLogger = new PinoLogger();

/**
 * サーバーサイド環境で使用する標準ロガー。
 * 構造化されたログ（JSON形式）をターミナルに出力します。
 *
 * 依存性逆転の原則 (DIP) に従い、利用側は Logger インターフェースとして扱います。
 */
export const logger: Logger = pinoLogger;
