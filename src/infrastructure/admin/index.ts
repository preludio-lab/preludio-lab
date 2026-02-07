import { AdminAuthRepository } from '@/domain/admin/admin-auth.repository';
import { AdminAuthRepositoryImpl } from './admin-auth.repository';
import { EnvAdminAuthDataSource } from './env.admin-auth.ds';

/**
 * AdminAuthRepository の共有インスタンス (Singleton)
 * 依存性の注入 (DI) の設定を行う
 */
const adminAuthDS = new EnvAdminAuthDataSource();
export const adminAuthRepository: AdminAuthRepository = new AdminAuthRepositoryImpl(adminAuthDS);
