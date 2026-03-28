import { IUserContext } from '@/application/shared/user-context.interface';
import { UserRole } from '@/domain/auth/user.metadata';
import { auth } from './auth';

/**
 * Auth.js (NextAuth) を使用したサーバーサイドでのユーザーコンテキスト実装
 */
export class ServerUserContext implements IUserContext {
  async getUserId(): Promise<string | undefined> {
    const session = await auth();
    return session?.user?.id;
  }

  async getRole(): Promise<UserRole> {
    const session = await auth();
    const rawRole = session?.user?.role;

    // インフラ層の役割 (OWNER 等) をドメイン層の UserRole (ADMIN) にマッピング
    if (rawRole === 'OWNER' || rawRole === 'EDITOR') {
      return UserRole.ADMIN;
    }

    return session?.user ? UserRole.USER : UserRole.GUEST;
  }

  async isAdmin(): Promise<boolean> {
    const role = await this.getRole();
    return role === UserRole.ADMIN;
  }

  async isAuthenticated(): Promise<boolean> {
    const userId = await this.getUserId();
    return !!userId;
  }
}
