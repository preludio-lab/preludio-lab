import { auth } from '@/infrastructure/auth/auth';
import { AdminUser, AdminUserSchema } from '@/domain/admin/admin-user';

/**
 * 現在のユーザーが管理者であるかを確認し、ドメインモデルとして返すユースケース
 *
 * 役割:
 * 1. 外部ライブラリ (NextAuth) のセッションを取得する
 * 2. ドメインエンティティ (AdminUser) にマッピングする
 * 3. 必要に応じてバリデーションを行う
 */
export async function verifyAdminUseCase(): Promise<AdminUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const role = session.user.role;

  if (!role) {
    return null;
  }

  // NextAuth の User から ドメイン層の AdminUser へマッピング
  const result = AdminUserSchema.safeParse({
    email: session.user.email,
    role: role,
    isDevBypass: (session.user as { isDevBypass?: boolean }).isDevBypass,
  });

  if (!result.success) {
    // データ構造の不整合がある場合は認可しない
    return null;
  }

  return result.data;
}
