import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 登录请求 DTO
 * 简单的用户名/密码登录
 */
export class LoginDto {
  @ApiProperty({ description: '用户名（租户标识）', example: 'tenant1' })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '租户ID' })
  tenantId: string;

  @ApiProperty({ description: '显示名称' })
  displayName: string;

  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '消息' })
  message: string;
}
