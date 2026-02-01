import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { StepFunFilesService } from './stepfun-files.service';

/**
 * AI 服务模块
 * 处理所有 AI 相关的接口
 */
@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, StepFunFilesService],
  exports: [AiService, StepFunFilesService],
})
export class AiModule {}
