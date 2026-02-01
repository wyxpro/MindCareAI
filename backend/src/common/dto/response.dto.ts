import { ApiProperty } from '@nestjs/swagger';

/**
 * 通用响应 DTO
 * 统一 API 响应格式
 */
export class ResponseDto<T = any> {
  @ApiProperty({ description: '状态码' })
  statusCode: number;

  @ApiProperty({ description: '响应消息' })
  message: string;

  @ApiProperty({ description: '响应数据', required: false })
  data?: T;

  @ApiProperty({ description: '时间戳' })
  timestamp: string;
}

/**
 * 分页响应 DTO
 */
export class PaginatedResponseDto<T = any> {
  @ApiProperty({ description: '数据列表' })
  items: T[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

/**
 * 分页查询参数 DTO
 */
export class PaginationDto {
  page?: number = 1;
  pageSize?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
