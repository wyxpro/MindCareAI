import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHealingTables1769937060000 implements MigrationInterface {
  name = 'CreateHealingTables1769937060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryRunner.query(`
      CREATE TABLE "healing_contents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "category" text NOT NULL,
        "content_type" text NOT NULL,
        "content_url" text,
        "duration" integer,
        "thumbnail_url" text,
        "tags" text[],
        "is_active" boolean NOT NULL DEFAULT true,
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_healing_contents_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "user_healing_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "healing_content_id" uuid NOT NULL,
        "duration_seconds" integer,
        "completed" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_healing_records_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "meditation_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "duration" integer NOT NULL,
        "completed" boolean NOT NULL DEFAULT false,
        "mood_before" text,
        "mood_after" text,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_meditation_sessions_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "user_favorites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_favorites_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_healing_contents_category" ON "healing_contents" ("category");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_healing_records_user_id" ON "user_healing_records" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_favorites_user_id" ON "user_favorites" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_user_favorites_user_id";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_user_healing_records_user_id";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_healing_contents_category";');
    await queryRunner.query('DROP TABLE IF EXISTS "user_favorites";');
    await queryRunner.query('DROP TABLE IF EXISTS "meditation_sessions";');
    await queryRunner.query('DROP TABLE IF EXISTS "user_healing_records";');
    await queryRunner.query('DROP TABLE IF EXISTS "healing_contents";');
  }
}
