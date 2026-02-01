import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * JWT 认证守卫
 * 验证 Supabase JWT token
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("未提供认证 token");
    }

    try {
      const secret = this.configService.get<string>("auth.jwtSecret");
      if (!secret) {
        throw new Error("JWT secret 未配置");
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      // 将用户信息附加到请求对象
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException("Token 无效或已过期");
    }

    return true;
  }

  /**
   * 从请求头中提取 token
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers["authorization"] as string;
    if (!authorization) {
      return undefined;
    }
    const [type, token] = authorization.split(" ");
    return type === "Bearer" ? token : undefined;
  }
}
