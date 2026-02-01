import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  CommunityPost,
  CommunityComment,
  PostLike,
  PostCategory,
} from "./entities/community.entity";

import { CommunityService } from "./community.service";
import { CommunityController } from "./community.controller";

/**
 * 社区模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunityPost,
      CommunityComment,
      PostLike,
      PostCategory,
    ]),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService, TypeOrmModule],
})
export class CommunityModule {}
