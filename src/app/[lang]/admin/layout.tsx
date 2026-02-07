import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { verifyAdminUseCase } from '@/application/admin/usecase/verify-admin.usecase';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';

/**
 * AdminLayout - 管理画面レイアウト (Server Component)
 *
 * 責務:
 * - 認証状態の検証（VerifyAdminUseCase）
 * - UI言語の取得（next-intl）
 * - Clientコンポーネントへのデータ伝達
 */
export default async function AdminLayoutPage({ children }: { children: React.ReactNode }) {
  // UseCase経由で認証済みユーザー情報を取得
  const adminUser = await verifyAdminUseCase();

  // 未認証の場合はサインインページへリダイレクト
  // Note: Middlewareでも保護されているが、二重チェックとして実装
  if (!adminUser) {
    redirect('/api/auth/signin');
  }

  // UI言語を取得（next-intl）
  const uiLocale = await getLocale();

  return (
    <AdminLayout userEmail={adminUser.email} uiLocale={uiLocale}>
      {children}
    </AdminLayout>
  );
}
