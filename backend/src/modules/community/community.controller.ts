import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CommunityPost, CommunityComment, PostCategory } from './entities/community.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('community')
@Controller('community')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) { }

    @Public()
    @Get('posts')
    @ApiOperation({ summary: '获取社区帖子列表' })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'categoryId', required: false, type: String })
    @ApiQuery({ name: 'isRecoveryStory', required: false, type: Boolean })
    async findAll(
        @Query('pageSize') pageSize?: number,
        @Query('page') page?: number,
        @Query('categoryId') categoryId?: string,
        @Query('isRecoveryStory') isRecoveryStory?: boolean,
    ): Promise<{ items: CommunityPost[], total: number }> {
        return this.communityService.findAll(pageSize, page, categoryId, isRecoveryStory);
    }

    @Public()
    @Get('categories')
    @ApiOperation({ summary: '获取帖子分类列表' })
    async findCategories(): Promise<PostCategory[]> {
        return this.communityService.findCategories();
    }

    @Public()
    @Get('posts/:id')
    @ApiOperation({ summary: '获取帖子详情' })
    async findOne(@Param('id') id: string): Promise<CommunityPost> {
        return this.communityService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('posts')
    @ApiOperation({ summary: '发布新帖子' })
    async createPost(@Request() req, @Body() postData: Partial<CommunityPost>) {
        return this.communityService.createPost(req.user.userId, postData);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('posts/:id/like')
    @ApiOperation({ summary: '点赞/取消点赞帖子' })
    async likePost(@Request() req, @Param('id') id: string) {
        const isLiked = await this.communityService.likePost(req.user.userId, id);
        return { success: true, isLiked };
    }

    @Public()
    @Get('posts/:id/comments')
    @ApiOperation({ summary: '获取帖子评论列表' })
    async findComments(@Param('id') id: string): Promise<CommunityComment[]> {
        return this.communityService.findComments(id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('posts/:id/comments')
    @ApiOperation({ summary: '发表评论' })
    async createComment(
        @Request() req,
        @Param('id') id: string,
        @Body('content') content: string,
        @Body('anonymousName') anonymousName?: string,
    ) {
        return this.communityService.createComment(req.user.userId, id, content, anonymousName);
    }
}
