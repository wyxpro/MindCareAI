import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateProfileDto, ProfileDto } from "./dto";
import {
  CurrentUser,
  CurrentUserId,
} from "../../common/decorators/current-user.decorator";
import { Roles, UserRole } from "../../common/decorators/roles.decorator";

/**
 * 用户控制器
 * 处理用户档案相关操作
 */
@ApiTags("users")
@Controller("users")
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取当前用户信息
   */
  @Get("me")
  @ApiOperation({ summary: "获取当前用户信息" })
  @ApiResponse({ status: 200, description: "获取成功", type: ProfileDto })
  async getCurrentProfile(
    @CurrentUserId() userId: string,
  ): Promise<ProfileDto> {
    return this.usersService.findOne(userId);
  }

  /**
   * 更新当前用户信息
   */
  @Put("me")
  @ApiOperation({ summary: "更新当前用户信息" })
  @ApiResponse({ status: 200, description: "更新成功", type: ProfileDto })
  async updateCurrentProfile(
    @CurrentUserId() userId: string,
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.usersService.update(
      userId,
      updateProfileDto,
      userId,
      user.role || UserRole.USER,
    );
  }

  /**
   * 获取指定用户信息
   */
  @Get(":id")
  @ApiOperation({ summary: "获取指定用户信息" })
  @ApiResponse({ status: 200, description: "获取成功", type: ProfileDto })
  async findOne(@Param("id") id: string): Promise<ProfileDto> {
    return this.usersService.findOne(id);
  }

  /**
   * 更新指定用户信息（管理员）
   */
  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: "更新指定用户信息（管理员）" })
  @ApiResponse({ status: 200, description: "更新成功", type: ProfileDto })
  async update(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.usersService.update(
      id,
      updateProfileDto,
      user.sub || user.id,
      user.role || UserRole.USER,
    );
  }

  /**
   * 获取所有用户列表（管理员/医生）
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: "获取所有用户列表" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: "获取成功" })
  async findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<{ items: ProfileDto[]; total: number }> {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  /**
   * 删除用户（仅管理员）
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "删除用户" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.usersService.remove(id, user.role || UserRole.USER);
  }
}
