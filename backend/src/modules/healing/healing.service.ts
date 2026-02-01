import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  HealingContent,
  UserHealingRecord,
  MeditationSession,
  UserFavorite,
} from "./entities/healing-content.entity";

@Injectable()
export class HealingService {
  constructor(
    @InjectRepository(HealingContent)
    private readonly healingContentRepository: Repository<HealingContent>,
    @InjectRepository(UserHealingRecord)
    private readonly userHealingRecordRepository: Repository<UserHealingRecord>,
    @InjectRepository(MeditationSession)
    private readonly meditationRepository: Repository<MeditationSession>,
    @InjectRepository(UserFavorite)
    private readonly favoriteRepository: Repository<UserFavorite>,
  ) {}

  /**
   * 获取所有疗愈内容
   */
  async findAll(category?: string): Promise<HealingContent[]> {
    if (category) {
      return this.healingContentRepository.find({ where: { category } });
    }
    return this.healingContentRepository.find();
  }

  /**
   * 获取单个疗愈内容
   */
  async findOne(id: string): Promise<HealingContent> {
    const content = await this.healingContentRepository.findOne({
      where: { id },
    });
    if (!content) {
      throw new NotFoundException("疗愈内容不存在");
    }
    return content;
  }

  /**
   * 记录用户疗愈活动
   */
  async recordActivity(
    userId: string,
    contentId: string,
    duration?: number,
  ): Promise<UserHealingRecord> {
    const record = this.userHealingRecordRepository.create({
      user_id: userId,
      healing_content_id: contentId,
      duration_seconds: duration,
      completed: true,
    });

    return this.userHealingRecordRepository.save(record);
  }

  /**
   * 获取用户的疗愈记录
   */
  async findUserRecords(userId: string): Promise<UserHealingRecord[]> {
    return this.userHealingRecordRepository.find({
      where: { user_id: userId },
      order: { created_at: "DESC" } as any,
    });
  }

  /**
   * 记录冥想
   */
  async recordMeditation(
    userId: string,
    sessionData: Partial<MeditationSession>,
  ): Promise<MeditationSession> {
    const session = this.meditationRepository.create({
      ...sessionData,
      user_id: userId,
    });
    return this.meditationRepository.save(session);
  }

  /**
   * 获取用户冥想历史
   */
  async findMeditationSessions(userId: string): Promise<MeditationSession[]> {
    return this.meditationRepository.find({
      where: { user_id: userId },
      order: { created_at: "DESC" } as any,
    });
  }

  /**
   * 获取冥想统计
   */
  async getMeditationStats(
    userId: string,
  ): Promise<{ totalMinutes: number; totalSessions: number }> {
    const sessions = await this.meditationRepository.find({
      where: { user_id: userId, completed: true },
    });
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + Math.floor(s.duration / 60),
      0,
    );
    return { totalMinutes, totalSessions: sessions.length };
  }

  /**
   * 切换收藏
   */
  async toggleFavorite(userId: string, contentId: string): Promise<boolean> {
    const existing = await this.favoriteRepository.findOne({
      where: { user_id: userId, content_id: contentId },
    });
    if (existing) {
      await this.favoriteRepository.remove(existing);
      return false;
    } else {
      const favorite = this.favoriteRepository.create({
        user_id: userId,
        content_id: contentId,
      });
      await this.favoriteRepository.save(favorite);
      return true;
    }
  }

  /**
   * 获取用户收藏列表
   */
  async findUserFavorites(userId: string): Promise<UserFavorite[]> {
    return this.favoriteRepository.find({
      where: { user_id: userId },
      order: { created_at: "DESC" } as any,
    });
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: string, contentId: string): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: { user_id: userId, content_id: contentId },
    });
    return count > 0;
  }

  /**
   * 增加访问量 (模拟)
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.healingContentRepository.increment({ id }, "view_count", 1);
  }
}
