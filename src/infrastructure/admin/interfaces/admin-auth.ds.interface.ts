import { AdminRole } from '@/domain/admin/admin-user';

/**
 * 管理者認証データソースのインターフェース
 */
export interface IAdminAuthDataSource {
  /**
   * メールアドレスに基づき、管理者の役割を取得する
   */
  getAuthorizedRole(email: string): Promise<AdminRole | null>;
}
