import { SetMetadata } from "@nestjs/common";

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = "user",
  DOCTOR = "doctor",
  ADMIN = "admin",
}

/**
 * 角色装饰器
 * 标记需要特定角色才能访问的路由
 * @example
 * @Roles(UserRole.ADMIN, UserRole.DOCTOR)
 * @Get('admin-only')
 * adminOnly() {}
 */
export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
