'use client';

import { useState } from 'react';
import {
  AdminSidebar,
  type AdminLocale,
  type AdminNavItem,
} from '@/components/layout/admin/AdminSidebar';
import { AdminHeader } from '@/components/layout/admin/AdminHeader';
import {
  UsersIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  NewspaperIcon,
} from '@/components/layout/admin/AdminIcons';
import { signOutAction } from '@/infrastructure/auth/auth';

/**
 * AdminLayoutClientのProps
 */
interface AdminLayoutClientProps {
  /** 認証済みユーザーのメールアドレス */
  userEmail: string;
  /** 現在のUI言語（next-intlから取得） */
  uiLocale: string;
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
 * AdminLayoutClient - 管理画面レイアウト (Client Component)
 *
 * Container層: UseCaseからのデータをPresentationalコンポーネントに渡す
 *
 * 責務:
 * - Content言語の状態管理
 * - Server Actionの呼び出し
 * - PresentationalコンポーネントへのProps伝達
 */
export function AdminLayoutClient({ userEmail, uiLocale, children }: AdminLayoutClientProps) {
  // Content編集言語の状態管理（デフォルトはUIの言語に合わせる）
  const [contentLocale, setContentLocale] = useState<AdminLocale>(
    (uiLocale as AdminLocale) || 'ja',
  );

  // サインアウトハンドラー
  const handleSignOut = async () => {
    await signOutAction();
  };

  return (
    <div className="flex h-screen bg-admin-content-bg">
      <AdminSidebar
        currentLocale={contentLocale}
        onLocaleChange={setContentLocale}
        navigationItems={NAVIGATION_ITEMS}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userName={userEmail} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
