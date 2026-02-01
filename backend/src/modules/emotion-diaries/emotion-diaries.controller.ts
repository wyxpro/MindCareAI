import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { EmotionDiariesService } from "./emotion-diaries.service";
import {
  CreateEmotionDiaryDto,
  UpdateEmotionDiaryDto,
  EmotionDiaryDto,
} from "./dto";
import {
  CurrentUserId,
  CurrentUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../common/decorators/roles.decorator";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

/**
 * 情绪日记控制器
 */
@ApiTags("emotion-diaries")
@Controller("emotion-diaries")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
export class EmotionDiariesController {
  constructor(private readonly emotionDiariesService: EmotionDiariesService) {}

  /**
   * 创建情绪日记
   */
  @Post()
  @ApiOperation({ summary: "创建情绪日记" })
  async create(
    @Body() createDto: CreateEmotionDiaryDto,
    @CurrentUserId() userId: string,
  ): Promise<EmotionDiaryDto> {
    return this.emotionDiariesService.create(createDto, userId);
  }

  /**
   * 获取情绪日记列表
   */
  @Get()
  @ApiOperation({ summary: "获取情绪日记列表" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async findAll(
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<{ items: EmotionDiaryDto[]; total: number }> {
    // 医生可以查看所有用户的日记
    const targetUserId =
      (user.role === "doctor" || user.role === "admin") && user.patientId
        ? user.patientId
        : userId;

    return this.emotionDiariesService.findAll(
      targetUserId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      startDate,
      endDate,
    );
  }

  /**
   * 获取单条情绪日记
   */
  @Get(":id")
  @ApiOperation({ summary: "获取单条情绪日记" })
  async findOne(
    @Param("id") id: string,
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
  ): Promise<EmotionDiaryDto> {
    return this.emotionDiariesService.findOne(
      id,
      userId,
      user.role || UserRole.USER,
    );
  }

  /**
   * 更新情绪日记
   */
  @Put(":id")
  @ApiOperation({ summary: "更新情绪日记" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateEmotionDiaryDto,
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
  ): Promise<EmotionDiaryDto> {
    return this.emotionDiariesService.update(
      id,
      updateDto,
      userId,
      user.role || UserRole.USER,
    );
  }

  /**
   * 删除情绪日记
   */
  @Delete(":id")
  @ApiOperation({ summary: "删除情绪日记" })
  async remove(
    @Param("id") id: string,
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.emotionDiariesService.remove(
      id,
      userId,
      user.role || UserRole.USER,
    );
  }
}
