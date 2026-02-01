import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * 租户实体
 * 每个租户代表一个独立的用户/组织
 */
@Entity("tenants")
export class Tenant {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "text", unique: true })
  username: string;

  @Column({ type: "text" })
  password: string;

  @Column({ type: "text", name: "display_name" })
  display_name: string;

  @Column({ type: "text", nullable: true })
  email: string;

  @Column({ type: "text", nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true, name: "avatar_url" })
  avatar_url: string;

  @Column({ type: "boolean", default: true, name: "is_active" })
  is_active: boolean;

  @Column({ type: "jsonb", nullable: true, name: "settings" })
  settings: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updated_at: Date;
}
