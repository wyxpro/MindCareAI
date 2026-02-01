import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmotionDiariesController } from './emotion-diaries.controller';
import { EmotionDiariesService } from './emotion-diaries.service';
import { EmotionDiary } from './entities/emotion-diary.entity';

/**
 * 情绪日记模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([EmotionDiary])],
  controllers: [EmotionDiariesController],
  providers: [EmotionDiariesService],
  exports: [EmotionDiariesService],
})
export class EmotionDiariesModule {}
