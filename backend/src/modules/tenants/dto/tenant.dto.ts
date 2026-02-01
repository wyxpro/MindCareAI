import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsBoolean,
  IsObject,
} from "class-validator";

/**
 * 创建租户 DTO
 */
export class CreateTenantDto {
  @ApiProperty({ description: "用户名（租户标识）" })
  @IsString()
  @MinLength(3, { message: "用户名长度不能少于3位" })
  @MaxLength(50, { message: "用户名长度不能超过50位" })
  username: string;

  @ApiProperty({ description: "密码" })
  @IsString()
  @MinLength(6, { message: "密码长度不能少于6位" })
  password: string;

  @ApiProperty({ description: "显示名称" })
  @IsString()
  displayName: string;

  @ApiProperty({ description: "邮箱", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "手机号", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "头像 URL", required: false })
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @ApiProperty({ description: "设置（JSON）", required: false })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

/**
 * 更新租户 DTO
 */
export class UpdateTenantDto {
  @ApiProperty({ description: "显示名称", required: false })
  @IsString()
  @IsOptional()
  display_name?: string;

  @ApiProperty({ description: "邮箱", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "手机号", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "头像 URL", required: false })
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @ApiProperty({ description: "是否激活", required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: "设置（JSON）", required: false })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

/**
 * 租户响应 DTO
 */
export class TenantDto {
  @ApiProperty({ description: "租户 ID" })
  id: string;

  @ApiProperty({ description: "用户名" })
  username: string;

  @ApiProperty({ description: "显示名称" })
  display_name: string;

  @ApiProperty({ description: "邮箱", required: false })
  email?: string;

  @ApiProperty({ description: "手机号", required: false })
  phone?: string;

  @ApiProperty({ description: "头像 URL", required: false })
  avatar_url?: string;

  @ApiProperty({ description: "是否激活" })
  is_active: boolean;

  @ApiProperty({ description: "设置", required: false })
  settings?: Record<string, any>;

  @ApiProperty({ description: "创建时间" })
  created_at: Date;

  @ApiProperty({ description: "更新时间" })
  updated_at: Date;
}
