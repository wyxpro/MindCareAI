import { ApiProperty } from '@nestjs/swagger';

/**
 * 认证响应 DTO
 */
export class AuthResponseDto {
  @ApiProperty({ description: '访问令牌' })
  access_token: string;

  @ApiProperty({ description: '令牌类型', example: 'Bearer' })
  token_type: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}
