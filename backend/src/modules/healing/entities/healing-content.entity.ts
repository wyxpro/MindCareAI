import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 疗愈内容实体
 */
@Entity('healing_contents')
export class HealingContent {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'text' })
  content_type: string;

  @Column({ type: 'text', nullable: true, name: 'content_url' })
  content_url: string;

  @Column({ type: 'integer', nullable: true })
  duration: number;

  @Column({ type: 'text', nullable: true, name: 'thumbnail_url' })
  thumbnail_url: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'integer', default: 0, name: 'view_count' })
  view_count: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}

/**
 * 用户疗愈记录实体
 */
@Entity('user_healing_records')
export class UserHealingRecord {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'healing_content_id' })
  healing_content_id: string;

  @Column({ type: 'integer', nullable: true, name: 'duration_seconds' })
  duration_seconds: number;

  @Column({ type: 'boolean', default: false, name: 'completed' })
  completed: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}

/**
 * 冥想记录实体
 */
@Entity('meditation_sessions')
export class MeditationSession {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'content_id' })
  content_id: string;

  @Column({ type: 'integer' })
  duration: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'text', nullable: true })
  mood_before: string;

  @Column({ type: 'text', nullable: true })
  mood_after: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}

/**
 * 用户收藏实体
 */
@Entity('user_favorites')
export class UserFavorite {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'content_id' })
  content_id: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
