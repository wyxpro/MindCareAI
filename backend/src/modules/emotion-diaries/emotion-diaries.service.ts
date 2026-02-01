import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EmotionDiary } from './entities/emotion-diary.entity';
import { CreateEmotionDiaryDto, UpdateEmotionDiaryDto, EmotionDiaryDto } from './dto';

/**
 * 情绪日记服务
 */
@Injectable()
export class EmotionDiariesService {
  constructor(
    @InjectRepository(EmotionDiary)
    private readonly emotionDiaryRepository: Repository<EmotionDiary>,
  ) {}

  /**
   * 创建情绪日记
   */
  async create(
    createDto: CreateEmotionDiaryDto,
    userId: string,
  ): Promise<EmotionDiaryDto> {
    const diary = this.emotionDiaryRepository.create({
      ...createDto,
      user_id: userId,
      diary_date: createDto.diary_date ? new Date(createDto.diary_date) : new Date(),
    });

    const saved = await this.emotionDiaryRepository.save(diary);
    return this.toDto(saved);
  }

  /**
   * 获取用户的所有情绪日记
   */
  async findAll(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    startDate?: string,
    endDate?: string,
  ): Promise<{ items: EmotionDiaryDto[]; total: number }> {
    let whereCondition: any = { user_id: userId };

    if (startDate && endDate) {
      whereCondition.diary_date = Between(new Date(startDate), new Date(endDate));
    }

    const [items, total] = await this.emotionDiaryRepository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { diary_date: 'DESC', created_at: 'DESC' },
    });

    return {
      items: items.map((item) => this.toDto(item)),
      total,
    };
  }

  /**
   * 根据日期获取情绪日记
   */
  async findByDate(userId: string, date: Date): Promise<EmotionDiaryDto | null> {
    const diary = await this.emotionDiaryRepository.findOne({
      where: {
        user_id: userId,
        diary_date: date,
      },
    });
    return diary ? this.toDto(diary) : null;
  }

  /**
   * 获取单条情绪日记
   */
  async findOne(id: string, userId: string, userRole: string): Promise<EmotionDiaryDto> {
    const diary = await this.emotionDiaryRepository.findOne({ where: { id } });
    if (!diary) {
      throw new NotFoundException('情绪日记不存在');
    }

    // 权限检查：用户只能查看自己的日记，医生可以查看所有
    if (diary.user_id !== userId && userRole !== 'doctor' && userRole !== 'admin') {
      throw new ForbiddenException('无权查看此日记');
    }

    return this.toDto(diary);
  }

  /**
   * 更新情绪日记
   */
  async update(
    id: string,
    updateDto: UpdateEmotionDiaryDto,
    userId: string,
    userRole: string,
  ): Promise<EmotionDiaryDto> {
    const diary = await this.emotionDiaryRepository.findOne({ where: { id } });
    if (!diary) {
      throw new NotFoundException('情绪日记不存在');
    }

    // 权限检查
    if (diary.user_id !== userId && userRole !== 'doctor' && userRole !== 'admin') {
      throw new ForbiddenException('无权修改此日记');
    }

    Object.assign(diary, updateDto);
    const updated = await this.emotionDiaryRepository.save(diary);
    return this.toDto(updated);
  }

  /**
   * 删除情绪日记
   */
  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const diary = await this.emotionDiaryRepository.findOne({ where: { id } });
    if (!diary) {
      throw new NotFoundException('情绪日记不存在');
    }

    // 权限检查
    if (diary.user_id !== userId && userRole !== 'admin') {
      throw new ForbiddenException('无权删除此日记');
    }

    await this.emotionDiaryRepository.remove(diary);
  }

  /**
   * 转换为 DTO
   */
  private toDto(diary: EmotionDiary): EmotionDiaryDto {
    return {
      id: diary.id,
      user_id: diary.user_id,
      diary_date: diary.diary_date.toISOString().split('T')[0],
      emotion_level: diary.emotion_level,
      title: diary.title || undefined,
      content: diary.content || undefined,
      tags: diary.tags || undefined,
      ai_analysis: diary.ai_analysis || undefined,
      created_at: diary.created_at,
      updated_at: diary.updated_at,
    };
  }
}
