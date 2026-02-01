import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from './entities/assessment.entity';
import { CreateAssessmentDto, UpdateAssessmentDto, AssessmentDto } from './dto';

import { AssessmentsModule } from './assessments.module';
import { AiService } from '../ai/ai.service';

/**
 * 评估记录服务
 */
@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    private readonly aiService: AiService,
  ) { }

  /**
   * 创建评估记录
   */
  async create(
    createDto: CreateAssessmentDto,
    userId: string,
  ): Promise<AssessmentDto> {
    const hasInput = Boolean(
      (createDto.text_input && createDto.text_input.trim().length > 0) ||
      createDto.image_input_url ||
      createDto.voice_input_url ||
      createDto.video_input_url,
    );

    // 有输入时才调用 AI，避免空记录导致外部服务异常
    const aiAnalysis = hasInput ? await this.aiService.multimodalAnalysis({
      model: 'step-3', // 使用 Step-3 模型
      messages: [
        {
          role: 'user',
          content: [
            ...(createDto.text_input
              ? [{ type: 'text' as const, text: createDto.text_input }]
              : []),
            ...(createDto.image_input_url
              ? [{ type: 'image_url' as const, image_url: { url: createDto.image_input_url } }]
              : []),
          ],
        },
      ],
    }) : undefined;

    const assessment = this.assessmentRepository.create({
      ...createDto,
      user_id: userId,
      ai_analysis: aiAnalysis,
      risk_level: aiAnalysis?.risk_level || 0,
    });

    const saved = await this.assessmentRepository.save(assessment);
    return this.toDto(saved);
  }

  /**
   * 获取评估记录列表
   */
  async findAll(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: AssessmentDto[]; total: number }> {
    const [items, total] = await this.assessmentRepository.findAndCount({
      where: { user_id: userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { created_at: 'DESC' },
    });

    return {
      items: items.map((item) => this.toDto(item)),
      total,
    };
  }

  /**
   * 获取单条评估记录
   */
  async findOne(id: string, userId: string, userRole: string): Promise<AssessmentDto> {
    const assessment = await this.assessmentRepository.findOne({ where: { id } });
    if (!assessment) {
      throw new NotFoundException('评估记录不存在');
    }

    if (assessment.user_id !== userId && userRole !== 'doctor' && userRole !== 'admin') {
      throw new ForbiddenException('无权查看此评估记录');
    }

    return this.toDto(assessment);
  }

  /**
   * 更新评估记录
   */
  async update(
    id: string,
    updateDto: UpdateAssessmentDto,
    userId: string,
    userRole: string,
  ): Promise<AssessmentDto> {
    const assessment = await this.assessmentRepository.findOne({ where: { id } });
    if (!assessment) {
      throw new NotFoundException('评估记录不存在');
    }

    if (assessment.user_id !== userId && userRole !== 'doctor' && userRole !== 'admin') {
      throw new ForbiddenException('无权修改此评估记录');
    }

    Object.assign(assessment, updateDto);
    const updated = await this.assessmentRepository.save(assessment);
    return this.toDto(updated);
  }

  /**
   * 转换为 DTO
   */
  private toDto(assessment: Assessment): AssessmentDto {
    return {
      id: assessment.id,
      user_id: assessment.user_id,
      assessment_type: assessment.assessment_type,
      conversation_history: assessment.conversation_history || [],
      text_input: assessment.text_input || undefined,
      voice_input_url: assessment.voice_input_url || undefined,
      image_input_url: assessment.image_input_url || undefined,
      video_input_url: assessment.video_input_url || undefined,
      ai_analysis: assessment.ai_analysis || undefined,
      risk_level: assessment.risk_level,
      score: assessment.score || undefined,
      report: assessment.report || undefined,
      created_at: assessment.created_at,
      updated_at: assessment.updated_at,
    };
  }
}
