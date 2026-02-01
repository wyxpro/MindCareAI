import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * 当前用户装饰器
 * 从请求中提取当前用户信息
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserInfo) {}
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 当前用户 ID 装饰器
 * 快速获取当前用户 ID
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub || request.user?.id;
  },
);
