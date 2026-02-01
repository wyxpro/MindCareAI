import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CommunityService } from "./community.service";
import {
  CommunityPost,
  CommunityComment,
  PostCategory,
} from "./entities/community.entity";
import { FindPostsDto } from "./dto/find-posts.dto";
import { CurrentUserId } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("community")
@Controller("community")
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);

  constructor(private readonly communityService: CommunityService) {}

  @Public()
  @Get("posts")
  @ApiOperation({ summary: "获取社区帖子列表" })
  async findAll(
    @Query() query: FindPostsDto,
  ): Promise<{ items: CommunityPost[]; total: number }> {
    this.logger.log(`findAll called with query: ${JSON.stringify(query)}`);
    const result = await this.communityService.findAll(
      query.pageSize,
      query.page,
      query.categoryId,
      query.isRecoveryStory,
    );
    this.logger.log(`findAll returning ${result.items.length} items`);
    return result;
  }

  @Public()
  @Get("categories")
  @ApiOperation({ summary: "获取帖子分类列表" })
  async findCategories(): Promise<PostCategory[]> {
    return this.communityService.findCategories();
  }

  @Public()
  @Get("posts/:id")
  @ApiOperation({ summary: "获取帖子详情" })
  async findOne(@Param("id") id: string): Promise<CommunityPost> {
    return this.communityService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("posts")
  @ApiOperation({ summary: "发布新帖子" })
  async createPost(
    @CurrentUserId() userId: string,
    @Body() postData: Partial<CommunityPost>,
  ) {
    return this.communityService.createPost(userId, postData);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("posts/:id/like")
  @ApiOperation({ summary: "点赞/取消点赞帖子" })
  async likePost(@CurrentUserId() userId: string, @Param("id") id: string) {
    const isLiked = await this.communityService.likePost(userId, id);
    return { success: true, isLiked };
  }

  @Public()
  @Get("posts/:id/comments")
  @ApiOperation({ summary: "获取帖子评论列表" })
  async findComments(@Param("id") id: string): Promise<CommunityComment[]> {
    return this.communityService.findComments(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("posts/:id/comments")
  @ApiOperation({ summary: "发表评论" })
  async createComment(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body("content") content: string,
    @Body("anonymousName") anonymousName?: string,
  ) {
    return this.communityService.createComment(
      userId,
      id,
      content,
      anonymousName,
    );
  }
}
