'use client';

import { useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AdminSidebar, type AdminLocale, type AdminNavItem } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { UsersIcon, MusicalNoteIcon, DocumentTextIcon, NewspaperIcon } from './AdminIcons';
import { signOutAction } from '@/infrastructure/auth/auth';

/**
 * AdminLayoutのProps
 */
interface AdminLayoutProps {
  /** 認証済みユーザーのメールアドレス */
  userEmail: string;
  /** 現在のUI言語（next-intlから取得） */
  uiLocale: string;
  /** 開発用認証バイパスが有効かどうかのフラグ */
  isDevBypass?: boolean;
  /** 子要素 */
  children: React.ReactNode;
}

/**
 * ナビゲーション項目の定義
 * TODO: i18n対応（現在は日本語固定）
 */
const NAVIGATION_ITEMS: AdminNavItem[] = [
  {
    id: 'composers',
    label: '作曲家',
    href: '/admin/composers',
    icon: <UsersIcon />,
  },
  {
    id: 'works',
    label: '作品',
    href: '/admin/works',
    icon: <MusicalNoteIcon />,
  },
  {
    id: 'phrases',
    label: 'フレーズ',
    href: '/admin/phrases',
    icon: <DocumentTextIcon />,
  },
  {
    id: 'articles',
    label: '記事',
    href: '/admin/articles',
    icon: <NewspaperIcon />,
  },
];

/**
 * AdminLayout - 管理画面レイアウト (Client Component)
 *
 * Container層: UseCaseからのデータをPresentationalコンポーネントに渡す
 *
 * 責務:
 * - Content言語の状態管理
 * - Server Actionの呼び出し
 * - PresentationalコンポーネントへのProps伝達
 */
export function AdminLayout({ userEmail, uiLocale, isDevBypass, children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLのcontentLangパラメータから初期値を取得（なければUI言語をデフォルトに）
  const initialLocale =
    (searchParams.get('contentLang') as AdminLocale) || (uiLocale as AdminLocale) || 'ja';
  const [contentLocale, setContentLocale] = useState<AdminLocale>(initialLocale);

  // 言語変更時にURLのsearchParamsも更新し、Server Componentの再レンダリングをトリガー
  const handleLocaleChange = useCallback(
    (locale: AdminLocale) => {
      setContentLocale(locale);
      const params = new URLSearchParams(searchParams.toString());
      params.set('contentLang', locale);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  // サインアウトハンドラー
  const handleSignOut = async () => {
    await signOutAction();
  };

  return (
    <div className="flex h-screen bg-admin-content-bg">
      <AdminSidebar
        currentLocale={contentLocale}
        onLocaleChange={handleLocaleChange}
        navigationItems={NAVIGATION_ITEMS}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userName={userEmail} isDevBypass={isDevBypass} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
