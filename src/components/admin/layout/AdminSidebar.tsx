'use client';

import { usePathname } from '@/shared/i18n/navigation';
import { Link } from '@/shared/i18n/navigation';

/**
 * 管理画面のナビゲーション項目の型定義
 */
export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * サポートされる言語の型定義
 */
export type AdminLocale = 'ja' | 'en' | 'de' | 'fr' | 'it' | 'es' | 'zh';

/**
 * AdminSidebarのProps
 * Presentationalパターン: ドメインモデルへの依存なし、Props経由でデータ受け取り
 */
export interface AdminSidebarProps {
  /** 現在選択中のコンテンツ編集言語 */
  currentLocale: AdminLocale;
  /** 言語変更時のコールバック */
  onLocaleChange: (locale: AdminLocale) => void;
  /** ナビゲーション項目のリスト */
  navigationItems: AdminNavItem[];
}

/**
 * 言語選択肢の定義
 */
const LOCALE_OPTIONS: { value: AdminLocale; label: string }[] = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
];

/**
 * AdminSidebar - 管理画面サイドバー (Presentational Component)
 *
 * Figma v2仕様:
 * - 幅: 240px固定
 * - 背景色: slate-50 (#F9FAFB)
 * - 言語選択ドロップダウン: コンテンツ編集言語の切り替え
 * - ナビゲーション: 作曲家、作品、フレーズ、記事
 */
export function AdminSidebar({
  currentLocale,
  onLocaleChange,
  navigationItems,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-admin-sidebar h-screen bg-admin-sidebar-bg border-r border-admin-border flex flex-col">
      {/* ヘッダー */}
      <div className="p-6 border-b border-admin-border">
        <h1 className="text-xl font-bold text-admin-text-primary">PreludioLab</h1>
        <p className="text-sm text-admin-text-secondary mt-1">Management</p>
      </div>

      {/* 言語選択 (Content Context) */}
      <div className="p-4 border-b border-admin-border">
        <label
          htmlFor="content-locale"
          className="block text-xs font-medium text-admin-text-secondary mb-2"
        >
          編集言語 / Content Language
        </label>
        <select
          id="content-locale"
          value={currentLocale}
          onChange={(e) => onLocaleChange(e.target.value as AdminLocale)}
          className="w-full px-3 py-2 text-sm border border-admin-border rounded-md bg-white text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-admin-primary-light text-admin-primary'
                    : 'text-admin-text-primary hover:bg-admin-primary-light/50'
                }
              `}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-admin-border">
        <p className="text-xs text-admin-text-secondary text-center">© 2026 PreludioLab</p>
      </div>
    </aside>
  );
}
