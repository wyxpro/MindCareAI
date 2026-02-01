import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { WearableData } from './entities/wearable-data.entity';

/**
 * 健康数据与服务检查模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([WearableData])],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService, TypeOrmModule],
})
export class HealthModule { }
