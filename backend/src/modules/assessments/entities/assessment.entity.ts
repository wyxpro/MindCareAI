import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 评估记录实体
 * 对应 Supabase public.assessments 表
 */
@Entity('assessments')
@Index(['user_id', 'created_at'])
export class Assessment {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'text', name: 'assessment_type', default: 'multimodal' })
  assessment_type: string;

  @Column({ type: 'jsonb', name: 'conversation_history', default: [] })
  conversation_history: Record<string, any>[];

  @Column({ type: 'text', name: 'text_input', nullable: true })
  text_input: string;

  @Column({ type: 'text', name: 'voice_input_url', nullable: true })
  voice_input_url: string;

  @Column({ type: 'text', name: 'image_input_url', nullable: true })
  image_input_url: string;

  @Column({ type: 'text', name: 'video_input_url', nullable: true })
  video_input_url: string;

  @Column({ type: 'jsonb', name: 'ai_analysis', nullable: true })
  ai_analysis: Record<string, any>;

  @Column({ type: 'integer', name: 'risk_level', default: 0 })
  risk_level: number;

  @Column({ type: 'integer', nullable: true })
  score: number;

  @Column({ type: 'jsonb', nullable: true })
  report: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
