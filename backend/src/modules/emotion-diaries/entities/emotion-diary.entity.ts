import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Profile } from "../../users/entities/profile.entity";

/**
 * 情绪等级枚举类型
 */
export type EmotionLevelType =
  | "very_bad"
  | "bad"
  | "neutral"
  | "good"
  | "very_good";

/**
 * 情绪日记实体
 * 对应 Supabase public.emotion_diaries 表
 */
@Entity("emotion_diaries")
@Index(["user_id", "diary_date"])
export class EmotionDiary {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @ManyToOne(() => Profile, (profile) => profile.diaries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: Profile;

  @Column({ type: "date", name: "diary_date", default: () => "CURRENT_DATE" })
  diary_date: Date;

  @Column({
    type: "enum",
    enum: ["very_bad", "bad", "neutral", "good", "very_good"],
    name: "emotion_level",
  })
  emotion_level: EmotionLevelType;

  @Column({ type: "text", nullable: true })
  title: string;

  @Column({ type: "text", nullable: true })
  content: string;

  @Column({ type: "text", array: true, nullable: true })
  tags: string[];

  @Column({ type: "text", array: true, nullable: true, name: "image_urls" })
  image_urls: string[];

  @Column({ type: "jsonb", nullable: true, name: "ai_analysis" })
  ai_analysis: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updated_at: Date;
}
