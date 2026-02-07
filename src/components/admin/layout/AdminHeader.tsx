'use client';

/**
 * AdminHeaderのProps
 * Presentationalパターン: ドメインモデルへの依存なし
 */
export interface AdminHeaderProps {
  /** 現在ログイン中のユーザー名（メールアドレス） */
  userName: string;
  /** サインアウト時のコールバック */
  onSignOut: () => void;
}

/**
 * AdminHeader - 管理画面ヘッダー (Presentational Component)
 *
 * Figma v2仕様:
 * - 高さ: 64px
 * - 背景色: white (#FFFFFF)
 * - パンくずリスト、検索窓、サインアウトボタン
 */
export function AdminHeader({ userName, onSignOut }: AdminHeaderProps) {
  return (
    <header className="h-admin-header bg-admin-card-bg border-b border-admin-border flex items-center justify-between px-8">
      {/* 左側: パンくずリスト（将来実装） */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-admin-text-primary">Dashboard</h2>
      </div>

      {/* 右側: ユーザー情報とサインアウト */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-admin-text-secondary">{userName}</span>
        <button
          onClick={onSignOut}
          className="px-4 py-2 text-sm font-medium text-white bg-admin-danger rounded-md hover:bg-admin-danger/90 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
