import { AdminRole } from '@/domain/admin/admin-user';
import { logger } from '@/infrastructure/logging';
import { IAdminAuthDataSource } from './interfaces/admin-auth.ds.interface';

/**
 * 環境変数に基づいた管理者認証データソースの実装
 */
export class EnvAdminAuthDataSource implements IAdminAuthDataSource {
  async getAuthorizedRole(email: string): Promise<AdminRole | null> {
    const adminEmail = process.env.ADMIN_EMAIL;

    logger.debug('[Auth Debug] EnvAdminAuthDataSource.getAuthorizedRole called with:', {
      providedEmail: email,
      envAdminEmail: adminEmail,
    });

    if (!adminEmail) {
      logger.debug('[Auth Debug] ADMIN_EMAIL is not set in environment variables.');
      return null;
    }

    // カンマ区切りで複数のメールアドレスを許可するように変更
    const allowedEmails = adminEmail.split(',').map((e) => e.trim().toLowerCase());

    if (allowedEmails.includes(email.toLowerCase())) {
      return 'OWNER';
    }

    logger.debug('[Auth Debug] Email mismatch.');
    return null;
  }
}
