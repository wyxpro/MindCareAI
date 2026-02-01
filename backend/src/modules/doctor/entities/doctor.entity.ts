import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * 医生患者关系实体
 */
@Entity('doctor_patients')
@Index(['doctor_id', 'status'])
export class DoctorPatient {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'doctor_id' })
  doctor_id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patient_id: string;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}

/**
 * 风险预警实体
 */
@Entity('risk_alerts')
@Index(['patient_id', 'created_at'])
@Index(['is_handled', 'created_at'])
export class RiskAlert {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patient_id: string;

  @Column({ type: 'text', name: 'alert_type' })
  alert_type: string;

  @Column({ type: 'integer', name: 'risk_level' })
  risk_level: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'data_source' })
  data_source: string;

  @Column({ type: 'uuid', nullable: true, name: 'source_id' })
  source_id: string;

  @Column({ type: 'boolean', default: false, name: 'is_handled' })
  is_handled: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'handled_by' })
  handled_by: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'handled_at' })
  handled_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}

/**
 * 知识库实体
 */
@Entity('knowledge_base')
@Index(['category', 'is_active'])
export class KnowledgeBase {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
