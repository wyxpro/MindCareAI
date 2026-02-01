import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Profile } from "../../users/entities/profile.entity";

/**
 * 树洞帖子实体
 */
@Entity("community_posts")
@Index(["created_at"])
export class CommunityPost {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @ManyToOne(() => Profile, (profile) => profile.posts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: Profile;

  @Column({ type: "text", name: "anonymous_name" })
  anonymous_name: string;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", array: true, nullable: true })
  tags: string[];

  @Column({ type: "integer", default: 0, name: "like_count" })
  like_count: number;

  @Column({ type: "integer", default: 0, name: "comment_count" })
  comment_count: number;

  @Column({ type: "boolean", default: false, name: "is_pinned" })
  is_pinned: boolean;

  @Column({ type: "boolean", default: false, name: "is_hidden" })
  is_hidden: boolean;

  @Column({ type: "uuid", nullable: true, name: "category_id" })
  category_id: string;

  @ManyToOne(() => PostCategory, (category) => category.posts, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  category: PostCategory;

  @OneToMany(() => CommunityComment, (comment) => comment.post)
  comments: CommunityComment[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @Column({ type: "boolean", default: false, name: "is_recovery_story" })
  is_recovery_story: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updated_at: Date;
}

/**
 * 社区分类实体
 */
@Entity("post_categories")
export class PostCategory {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true, name: "icon_url" })
  icon_url: string;

  @OneToMany(() => CommunityPost, (post) => post.category)
  posts: CommunityPost[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;
}

/**
 * 树洞评论实体
 */
@Entity("community_comments")
@Index(["post_id", "created_at"])
export class CommunityComment {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "uuid", name: "post_id" })
  post_id: string;

  @ManyToOne(() => CommunityPost, (post) => post.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "post_id" })
  post: CommunityPost;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @ManyToOne(() => Profile, (profile) => profile.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: Profile;

  @Column({ type: "text", name: "anonymous_name" })
  anonymous_name: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "integer", default: 0, name: "like_count" })
  like_count: number;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;
}

/**
 * 点赞记录实体
 */
@Entity("post_likes")
export class PostLike {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "uuid", name: "post_id" })
  post_id: string;

  @ManyToOne(() => CommunityPost, (post) => post.likes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post: CommunityPost;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @ManyToOne(() => Profile, (profile) => profile.likes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: Profile;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;
}
