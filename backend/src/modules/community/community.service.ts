import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPost, CommunityComment, PostLike, PostCategory } from './entities/community.entity';

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(CommunityPost)
        private readonly postRepository: Repository<CommunityPost>,
        @InjectRepository(CommunityComment)
        private readonly commentRepository: Repository<CommunityComment>,
        @InjectRepository(PostLike)
        private readonly likeRepository: Repository<PostLike>,
        @InjectRepository(PostCategory)
        private readonly categoryRepository: Repository<PostCategory>,
    ) { }

    /**
     * 获取所有帖子
     */
    async findAll(pageSize: number = 20, page: number = 1, categoryId?: string, isRecoveryStory?: boolean): Promise<{ items: CommunityPost[], total: number }> {
        const where: any = { is_hidden: false };
        if (categoryId) where.category_id = categoryId;
        if (isRecoveryStory !== undefined) where.is_recovery_story = isRecoveryStory;

        const [items, total] = await this.postRepository.findAndCount({
            where,
            order: { is_pinned: 'DESC', created_at: 'DESC' } as any,
            take: pageSize,
            skip: (page - 1) * pageSize,
        });
        return { items, total };
    }

    /**
     * 获取单个帖子详情（带评论）
     */
    async findOne(id: string): Promise<CommunityPost> {
        const post = await this.postRepository.findOne({ where: { id, is_hidden: false } });
        if (!post) {
            throw new NotFoundException('帖子不存在');
        }
        return post;
    }

    /**
     * 创建帖子
     */
    async createPost(userId: string, postData: Partial<CommunityPost>): Promise<CommunityPost> {
        const post = this.postRepository.create({
            ...postData,
            user_id: userId,
            anonymous_name: postData.anonymous_name || '守护者',
        });
        return this.postRepository.save(post);
    }

    /**
     * 点赞帖子
     */
    async likePost(userId: string, postId: string): Promise<boolean> {
        const existingLike = await this.likeRepository.findOne({ where: { user_id: userId, post_id: postId } });
        if (existingLike) {
            await this.likeRepository.remove(existingLike);
            await this.postRepository.decrement({ id: postId }, 'like_count', 1);
            return false; // 取消点赞
        } else {
            const like = this.likeRepository.create({ user_id: userId, post_id: postId });
            await this.likeRepository.save(like);
            await this.postRepository.increment({ id: postId }, 'like_count', 1);
            return true; // 点赞成功
        }
    }

    /**
     * 获取帖子评论
     */
    async findComments(postId: string): Promise<CommunityComment[]> {
        return this.commentRepository.find({
            where: { post_id: postId },
            order: { created_at: 'ASC' } as any,
        });
    }

    /**
     * 发表评论
     */
    async createComment(userId: string, postId: string, content: string, anonymousName?: string): Promise<CommunityComment> {
        const comment = this.commentRepository.create({
            user_id: userId,
            post_id: postId,
            content,
            anonymous_name: anonymousName || '守护者',
        });
        const savedComment = await this.commentRepository.save(comment);
        await this.postRepository.increment({ id: postId }, 'comment_count', 1);
        return savedComment;
    }

    /**
     * 获取帖子分类
     */
    async findCategories(): Promise<PostCategory[]> {
        return this.categoryRepository.find({ order: { created_at: 'ASC' } as any });
    }
}
