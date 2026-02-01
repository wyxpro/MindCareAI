import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  MaxLength,
} from "class-validator";

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = "user",
  DOCTOR = "doctor",
  ADMIN = "admin",
}

/**
 * 用户角色类型（字符串字面量）
 */
export type UserRoleType = "user" | "doctor" | "admin";

/**
 * Profile DTO
 */
export class ProfileDto {
  @ApiProperty({ description: "用户 ID" })
  id: string;

  @ApiProperty({ description: "用户名" })
  username: string;

  @ApiProperty({ description: "邮箱", required: false })
  email?: string;

  @ApiProperty({ description: "手机号", required: false })
  phone?: string;

  @ApiProperty({
    description: "角色",
    enum: UserRole,
    enumName: "UserRole",
  })
  role: UserRoleType;

  @ApiProperty({ description: "头像 URL", required: false })
  avatar_url?: string;

  @ApiProperty({ description: "全名", required: false })
  full_name?: string;

  @ApiProperty({ description: "性别", required: false })
  gender?: string;

  @ApiProperty({ description: "出生日期", required: false })
  birth_date?: string;

  @ApiProperty({ description: "创建时间" })
  created_at: Date;

  @ApiProperty({ description: "更新时间" })
  updated_at: Date;
}

/**
 * 更新用户档案 DTO
 */
export class UpdateProfileDto {
  @ApiProperty({ description: "用户名", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  username?: string;

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

  @ApiProperty({ description: "全名", required: false })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ description: "性别", required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ description: "出生日期", required: false })
  @IsDateString()
  @IsOptional()
  birth_date?: string;
}
