/**
 * ユーザーの権限ロール定義
 * 将来の Supabase 移行を見据え、ビジネスロジックで扱うための抽象的なロールを定義します。
 */
export const UserRole = {
  /** システム管理者 (全権限) */
  ADMIN: 'admin',
  /** 一般ユーザー (自身のデータのみ編集可能、または閲覧のみ) */
  USER: 'user',
  /** ゲスト (閲覧のみ、未ログイン等) */
  GUEST: 'guest',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
