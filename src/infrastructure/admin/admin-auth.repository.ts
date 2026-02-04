import { AdminAuthRepository } from '@/domain/admin/admin-auth.repository';
import { AdminRole } from '@/domain/admin/admin-user';
import { IAdminAuthDataSource } from './interfaces/admin-auth.ds.interface';

/**
 * 管理者認証リポジトリの実装
 * 複数のデータソースを調整する役割
 */
export class AdminAuthRepositoryImpl implements AdminAuthRepository {
  constructor(private dataSource: IAdminAuthDataSource) {}

  async getRole(email: string): Promise<AdminRole | null> {
    return await this.dataSource.getAuthorizedRole(email);
  }
}
