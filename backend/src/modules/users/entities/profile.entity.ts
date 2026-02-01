import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { EmotionDiary } from "../../emotion-diaries/entities/emotion-diary.entity";
import {
  CommunityPost,
  CommunityComment,
  PostLike,
} from "../../community/entities/community.entity";

/**
 * 用户角色枚举类型
 * 对应 PostgreSQL 的 user_role 枚举
 */
export type UserRoleType = "user" | "doctor" | "admin";

/**
 * Profile 实体
 * 对应 Supabase public.profiles 表
 */
@Entity("profiles")
export class Profile {
  @PrimaryColumn({ type: "uuid" })
  id: string;

  @Column({ type: "text", unique: true })
  username: string;

  @Column({ type: "text", nullable: true })
  email: string;

  @Column({ type: "text", nullable: true })
  phone: string;

  /**
   * 用户角色
   * 使用 string 类型存储，对应 PostgreSQL 的 user_role 枚举
   */
  @Column({
    type: "enum",
    enum: ["user", "doctor", "admin"],
    default: "user",
  })
  role: UserRoleType;

  @Column({ type: "text", nullable: true })
  avatar_url: string;

  @Column({ type: "text", nullable: true })
  full_name: string;

  @Column({ type: "text", nullable: true })
  gender: string;

  @Column({ type: "date", nullable: true })
  birth_date: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updated_at: Date;

  @OneToMany(() => EmotionDiary, (diary) => diary.user)
  diaries: EmotionDiary[];

  @OneToMany(() => CommunityPost, (post) => post.user)
  posts: CommunityPost[];

  @OneToMany(() => CommunityComment, (comment) => comment.user)
  comments: CommunityComment[];

  @OneToMany(() => PostLike, (like) => like.user)
  likes: PostLike[];
}
