import '@/app/[lang]/admin/(protected)/admin.css';

/**
 * AdminAuthLayout - 管理画面 認証レイアウト (Server Component)
 *
 * 責務:
 * - ログイン画面における独立したデザイン環境の提供
 * - グローバルサイトのナビゲーションやフッターの影響を排除し、管理画面としての独立性を守る
 */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  // `admin.css` をロードしてTailwindのカスタムクラス等を適用できるようにする
  // 背景色などはここでグローバルに設定する
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
