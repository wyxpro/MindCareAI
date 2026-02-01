import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssessmentsTable1769928929328 implements MigrationInterface {
  name = 'CreateAssessmentsTable1769928929328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "assessment_type" text NOT NULL DEFAULT 'multimodal',
        "conversation_history" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "text_input" text,
        "voice_input_url" text,
        "image_input_url" text,
        "video_input_url" text,
        "ai_analysis" jsonb,
        "risk_level" integer NOT NULL DEFAULT 0,
        "score" integer,
        "report" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assessments_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assessments_user_id_created_at" ON "assessments" ("user_id", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_assessments_user_id_created_at";');
    await queryRunner.query('DROP TABLE IF EXISTS "assessments";');
  }
}
