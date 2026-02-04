import { AdminRole } from './admin-user';

/**
 * 管理者認証リポジトリのインターフェース
 * 依存関係逆転の原則 (DIP) に基づき、ドメイン層で定義
 */
export interface AdminAuthRepository {
  /**
   * メールアドレスに基づき、管理者の役割を取得する
   * 認可されていない場合は null を返す
   */
  getRole(email: string): Promise<AdminRole | null>;
}
