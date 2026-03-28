import { UserRole } from '@/domain/auth/user.metadata';

/**
 * 実行ユーザーのコンテキスト情報を提供するインターフェース
 *
 * 依存性逆転の原則 (DIP) に基づき、ビジネスロジック (UseCase) が
 * Auth.js や Supabase などの具体的な認証技術に直接依存するのを防ぎます。
 */
export interface IUserContext {
  /** 現在のユーザー ID を取得します。未認証の場合は undefined を返します。 */
  getUserId(): Promise<string | undefined>;

  /** 現在のユーザーのロールを取得します。未認証の場合は GUEST を返します。 */
  getRole(): Promise<UserRole>;

  /** 管理者権限を持っているかどうかを返します。 */
  isAdmin(): Promise<boolean>;

  /** 認証済みかどうかを返します。 */
  isAuthenticated(): Promise<boolean>;
}
