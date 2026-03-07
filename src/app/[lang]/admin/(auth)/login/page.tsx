import { getLocale } from 'next-intl/server';
import { LoginForm } from '@/components/admin/auth/LoginForm';
import { NODE_ENV } from '@/lib/constants';

/**
 * AdminLoginPage - 管理画面ログイン (Server Component)
 *
 * 責務:
 * - /login へアクセスした際のUI描画
 * - サーバーサイドでのロケール取得
 */
export default async function AdminLoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const locale = await getLocale();
  const callbackUrl = searchParams.callbackUrl;

  // サーバーサイドのみで環境変数を評価し、結果のみをClient Componentに渡す
  const isDevBypassEnabled =
    process.env.NODE_ENV === NODE_ENV.DEVELOPMENT && process.env.DEV_AUTH_BYPASS === 'true';

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100/50">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Preludio Lab Admin</h1>
        <p className="text-slate-500 mt-2 text-sm">Please sign in to continue</p>
      </div>

      <LoginForm
        callbackUrl={callbackUrl}
        locale={locale}
        isDevBypassEnabled={isDevBypassEnabled}
      />
    </div>
  );
}
