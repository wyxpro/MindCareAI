import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, UserRole } from "../decorators/roles.decorator";

/**
 * 角色守卫
 * 检查用户是否具有访问权限
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取装饰器设置的角色要求
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置角色要求，则允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("用户未认证");
    }

    // 从 Supabase JWT 中获取用户角色
    // user.role 应该在 JWT payload 中，或者需要从数据库查询
    const userRole = user.role || user.user_metadata?.role || UserRole.USER;

    // 检查用户角色是否在允许的角色列表中
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException("需要更高的权限才能访问此资源");
    }

    return true;
  }
}
