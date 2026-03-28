import { IUserContext } from '@/application/shared/user-context.interface';
import { AppError } from '@/domain/shared/app-error';

/**
 * 管理者権限を強制するガード関数
 *
 * 権限が不足している場合は AppError (UNAUTHORIZED) をスローします。
 * Server Action の冒頭で呼び出すことで、不正な操作を早期に拒絶します。
 *
 * @param ctx 実行ユーザーのコンテキスト
 * @throws {AppError} 権限が ADMIN ではない場合
 */
export async function ensureAdmin(ctx: IUserContext): Promise<void> {
  const isAdmin = await ctx.isAdmin();
  if (!isAdmin) {
    throw new AppError('この操作を実行するための管理者権限がありません。', 'UNAUTHORIZED', 403);
  }
}

/**
 * 認証済みであることを強制するガード関数
 *
 * @param ctx 実行ユーザーのコンテキスト
 * @throws {AppError} 未ログインの場合
 */
export async function ensureAuthenticated(ctx: IUserContext): Promise<void> {
  const isAuthenticated = await ctx.isAuthenticated();
  if (!isAuthenticated) {
    throw new AppError('この操作を実行するにはログインが必要です。', 'UNAUTHORIZED', 401);
  }
}
