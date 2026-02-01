import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthTables1769928062116 implements MigrationInterface {
  name = 'InitAuthTables1769928062116';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profiles_role_enum') THEN
          CREATE TYPE "profiles_role_enum" AS ENUM ('user', 'doctor', 'admin');
        END IF;
      END$$;
    `);
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "username" text NOT NULL,
        "password" text NOT NULL,
        "display_name" text NOT NULL,
        "email" text,
        "phone" text,
        "avatar_url" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "settings" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_username" UNIQUE ("username")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL,
        "username" text NOT NULL,
        "email" text,
        "phone" text,
        "role" "profiles_role_enum" NOT NULL DEFAULT 'user',
        "avatar_url" text,
        "full_name" text,
        "gender" text,
        "birth_date" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_profiles_username" UNIQUE ("username")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "profiles";');
    await queryRunner.query('DROP TABLE IF EXISTS "tenants";');
    await queryRunner.query('DROP TYPE IF EXISTS "profiles_role_enum";');
  }
}
