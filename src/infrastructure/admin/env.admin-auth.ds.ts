import { AdminRole } from '@/domain/admin/admin-user';
import { IAdminAuthDataSource } from './interfaces/admin-auth.ds.interface';

/**
 * 環境変数に基づいた管理者認証データソースの実装
 */
export class EnvAdminAuthDataSource implements IAdminAuthDataSource {
  async getAuthorizedRole(email: string): Promise<AdminRole | null> {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return null;
    }

    if (email === adminEmail) {
      return 'OWNER';
    }

    return null;
  }
}
