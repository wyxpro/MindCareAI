import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { CommunityPost } from "./community-post.entity";

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
