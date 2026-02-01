import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * 手环/健康数据实体
 */
@Entity("wearable_data")
@Index(["user_id", "record_date"])
export class WearableData {
  @PrimaryColumn({ type: "uuid", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @Column({ type: "date", name: "record_date" })
  record_date: string;

  @Column({ type: "integer", nullable: true, name: "heart_rate" })
  heart_rate: number;

  @Column({ type: "float", nullable: true, name: "sleep_hours" })
  sleep_hours: number;

  @Column({ type: "integer", nullable: true, name: "sleep_quality" })
  sleep_quality: number;

  @Column({ type: "integer", nullable: true })
  steps: number;

  @Column({ type: "integer", nullable: true })
  calories: number;

  @Column({ type: "integer", nullable: true, name: "stress_level" })
  stress_level: number;

  @Column({ type: "jsonb", nullable: true, name: "data_json" })
  data_json: any;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;
}
