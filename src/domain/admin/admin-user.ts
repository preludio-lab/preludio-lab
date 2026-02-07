import { z } from 'zod';

/**
 * 管理者の役割定義
 * 将来的な拡張性（校閲者など）を考慮
 */
export const AdminRoleSchema = z.enum(['OWNER', 'EDITOR']);
export type AdminRole = z.infer<typeof AdminRoleSchema>;

/**
 * 管理者ユーザーエンティティ
 */
export const AdminUserSchema = z.object({
  email: z.string().email(),
  role: AdminRoleSchema,
});

export type AdminUser = z.infer<typeof AdminUserSchema>;
