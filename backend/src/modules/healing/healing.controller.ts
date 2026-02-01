import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { HealingService } from "./healing.service";
import {
  HealingContent,
  UserHealingRecord,
} from "./entities/healing-content.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUserId } from "../../common/decorators/current-user.decorator";

@ApiTags("疗愈内容")
@Controller("healing")
export class HealingController {
  constructor(private readonly healingService: HealingService) {}

  @Get("contents")
  @ApiOperation({ summary: "获取所有疗愈内容" })
  @ApiQuery({ name: "category", required: false, description: "内容分类" })
  @ApiResponse({ status: 200, description: "成功返回内容列表" })
  async findAll(
    @Query("category") category?: string,
  ): Promise<HealingContent[]> {
    return this.healingService.findAll(category);
  }

  @Get("contents/:id")
  @ApiOperation({ summary: "获取单个疗愈内容详情" })
  @ApiResponse({ status: 200, description: "成功返回内容详情" })
  async findOne(@Query("id") id: string): Promise<HealingContent> {
    return this.healingService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("records")
  @ApiOperation({ summary: "记录用户疗愈活动" })
  @ApiResponse({ status: 201, description: "记录成功" })
  async recordActivity(
    @CurrentUserId() userId: string,
    @Body("contentId") contentId: string,
    @Body("duration") duration?: number,
  ): Promise<UserHealingRecord> {
    return this.healingService.recordActivity(userId, contentId, duration);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("records")
  @ApiOperation({ summary: "获取用户疗愈历史汇总" })
  @ApiResponse({ status: 200, description: "成功返回记录列表" })
  async findUserRecords(
    @CurrentUserId() userId: string,
  ): Promise<UserHealingRecord[]> {
    return this.healingService.findUserRecords(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("meditation/sessions")
  @ApiOperation({ summary: "创建冥想记录" })
  async recordMeditation(
    @CurrentUserId() userId: string,
    @Body() sessionData: any,
  ) {
    return this.healingService.recordMeditation(userId, sessionData);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("meditation/sessions")
  @ApiOperation({ summary: "获取用户冥想历史" })
  async findMeditationSessions(@CurrentUserId() userId: string) {
    return this.healingService.findMeditationSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("meditation/stats")
  @ApiOperation({ summary: "获取冥想统计数据" })
  async getMeditationStats(@CurrentUserId() userId: string) {
    return this.healingService.getMeditationStats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("favorites/:contentId/toggle")
  @ApiOperation({ summary: "切换收藏状态" })
  async toggleFavorite(
    @CurrentUserId() userId: string,
    @Param("contentId") contentId: string,
  ) {
    const isFavorited = await this.healingService.toggleFavorite(
      userId,
      contentId,
    );
    return { success: true, isFavorited };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("favorites")
  @ApiOperation({ summary: "获取用户收藏列表" })
  async findUserFavorites(@CurrentUserId() userId: string) {
    return this.healingService.findUserFavorites(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("favorites/:contentId/check")
  @ApiOperation({ summary: "检查是否已收藏" })
  async isFavorited(
    @CurrentUserId() userId: string,
    @Param("contentId") contentId: string,
  ) {
    const isFavorited = await this.healingService.isFavorited(
      userId,
      contentId,
    );
    return { isFavorited };
  }

  @Public()
  @Post("contents/:id/view")
  @ApiOperation({ summary: "增加内容访问量" })
  async incrementViewCount(@Param("id") id: string) {
    await this.healingService.incrementViewCount(id);
    return { success: true };
  }
}
