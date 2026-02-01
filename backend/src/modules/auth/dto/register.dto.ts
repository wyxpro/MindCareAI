import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
} from "class-validator";

/**
 * 注册请求 DTO
 */
export class RegisterDto {
  @ApiProperty({
    description: "邮箱",
    example: "user@example.com",
    required: false,
  })
  @IsEmail({}, { message: "邮箱格式不正确" })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "密码", example: "password123" })
  @IsString({ message: "密码必须是字符串" })
  @IsNotEmpty({ message: "密码不能为空" })
  @MinLength(6, { message: "密码长度不能少于6位" })
  password: string;

  @ApiProperty({ description: "用户名", example: "john_doe" })
  @IsString({ message: "用户名必须是字符串" })
  @IsNotEmpty({ message: "用户名不能为空" })
  @MaxLength(50, { message: "用户名长度不能超过50个字符" })
  username: string;

  @ApiProperty({
    description: "手机号",
    example: "+86 13800138000",
    required: false,
  })
  @IsString({ message: "手机号必须是字符串" })
  @IsOptional()
  phone?: string;
}
