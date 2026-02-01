import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { CommunityPost } from "./community-post.entity";
import { Profile } from "../../users/entities/profile.entity";

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
