import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WearableData } from './entities/wearable-data.entity';

/**
 * 健康数据与服务检查控制器
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务正常运行' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('wearable')
  @ApiOperation({ summary: '获取用户手环数据' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findWearableData(@Request() req, @Query('limit') limit?: number): Promise<WearableData[]> {
    return this.healthService.findWearableData(req.user.userId, limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('wearable')
  @ApiOperation({ summary: '录入手环健康数据' })
  async createWearableData(@Request() req, @Body() data: Partial<WearableData>): Promise<WearableData> {
    return this.healthService.createWearableData(req.user.userId, data);
  }
}
