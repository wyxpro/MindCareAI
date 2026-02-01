import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { CommunityPost } from "./community-post.entity";
import { Profile } from "../../users/entities/profile.entity";

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
