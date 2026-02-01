import {
  Controller,
  Get,
  Post,
  Put,
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
import { AssessmentsService } from "./assessments.service";
import { CreateAssessmentDto, UpdateAssessmentDto, AssessmentDto } from "./dto";
import {
  CurrentUserId,
  CurrentUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

/**
 * 评估记录控制器
 */
@ApiTags("assessments")
@Controller("assessments")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  /**
   * 创建评估记录
   */
  @Post()
  @ApiOperation({ summary: "创建评估记录" })
  async create(
    @Body() createDto: CreateAssessmentDto,
    @CurrentUserId() userId: string,
  ): Promise<AssessmentDto> {
    return this.assessmentsService.create(createDto, userId);
  }

  /**
   * 获取评估记录列表
   */
  @Get()
  @ApiOperation({ summary: "获取评估记录列表" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  async findAll(
    @CurrentUserId() userId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<{ items: AssessmentDto[]; total: number }> {
    return this.assessmentsService.findAll(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  /**
   * 获取单条评估记录
   */
  @Get(":id")
  @ApiOperation({ summary: "获取单条评估记录" })
  async findOne(
    @Param("id") id: string,
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
  ): Promise<AssessmentDto> {
    return this.assessmentsService.findOne(
      id,
      userId,
      user.role || UserRole.USER,
    );
  }

  /**
   * 更新评估记录
   */
  @Put(":id")
  @ApiOperation({ summary: "更新评估记录" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateAssessmentDto,
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
  ): Promise<AssessmentDto> {
    return this.assessmentsService.update(
      id,
      updateDto,
      userId,
      user.role || UserRole.USER,
    );
  }
}
