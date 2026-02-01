import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  HealingContent,
  UserHealingRecord,
  MeditationSession,
  UserFavorite,
} from "./entities/healing-content.entity";

import { HealingService } from "./healing.service";
import { HealingController } from "./healing.controller";

/**
 * 疗愈内容模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      HealingContent,
      UserHealingRecord,
      MeditationSession,
      UserFavorite,
    ]),
  ],
  controllers: [HealingController],
  providers: [HealingService],
  exports: [TypeOrmModule, HealingService],
})
export class HealingModule {}
