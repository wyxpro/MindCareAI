import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMissingTables1769957784509 implements MigrationInterface {
  name = "InitialMissingTables1769957784509";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_healing_contents_category"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_healing_records_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_favorites_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_assessments_user_id_created_at"`,
    );
    await queryRunner.query(
      `CREATE TABLE "wearable_data" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "record_date" date NOT NULL, "heart_rate" integer, "sleep_hours" double precision, "sleep_quality" integer, "steps" integer, "calories" integer, "stress_level" integer, "data_json" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e8e0dca02a9e76c7e75bf6af355" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2692f9f4be5f710fe6ed73940" ON "wearable_data" ("user_id", "record_date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."emotion_diaries_emotion_level_enum" AS ENUM('very_bad', 'bad', 'neutral', 'good', 'very_good')`,
    );
    await queryRunner.query(
      `CREATE TABLE "emotion_diaries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "diary_date" date NOT NULL DEFAULT ('now'::text)::date, "emotion_level" "public"."emotion_diaries_emotion_level_enum" NOT NULL, "title" text, "content" text, "tags" text array, "ai_analysis" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2e2d06c81f9a7b1f65aaae15294" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a48e192ed92e80352cde0f675" ON "emotion_diaries" ("user_id", "diary_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "community_posts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "anonymous_name" text NOT NULL, "title" text NOT NULL, "content" text NOT NULL, "tags" text array, "like_count" integer NOT NULL DEFAULT '0', "comment_count" integer NOT NULL DEFAULT '0', "is_pinned" boolean NOT NULL DEFAULT false, "is_hidden" boolean NOT NULL DEFAULT false, "category_id" uuid, "is_recovery_story" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_af0c0b33e03b933e3e48119f2e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27cd3054507a0982a5ac701ef0" ON "community_posts" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "post_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "description" text, "icon_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9c45c4e9fb6ebf296990e1d3972" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "community_comments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "anonymous_name" text NOT NULL, "content" text NOT NULL, "like_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bddaf18297fe4a6d1cd539586b3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa9f443425b4d5c0b0ffc8a01d" ON "community_comments" ("post_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "post_likes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e4ac7cb9daf243939c6eabb2e0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_patients" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "doctor_id" uuid NOT NULL, "patient_id" uuid NOT NULL, "status" text NOT NULL DEFAULT 'active', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e7610969ee0504568a692ed1adf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2da562a5161d38d922698afbc5" ON "doctor_patients" ("doctor_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "risk_alerts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "patient_id" uuid NOT NULL, "alert_type" text NOT NULL, "risk_level" integer NOT NULL, "description" text NOT NULL, "data_source" text, "source_id" uuid, "is_handled" boolean NOT NULL DEFAULT false, "handled_by" uuid, "handled_at" TIMESTAMP WITH TIME ZONE, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a6f70c28842280b4e39d84bdfb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3b0ea9b3c2185be4026dc9cc86" ON "risk_alerts" ("is_handled", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6eee42ad33e7bba628db00c9cf" ON "risk_alerts" ("patient_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "knowledge_base" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" text NOT NULL, "content" text NOT NULL, "category" text NOT NULL, "tags" text array, "is_active" boolean NOT NULL DEFAULT true, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_19d3f52f6da1501b7e235f1da5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a825470e8b0a92220df7b38d35" ON "knowledge_base" ("category", "is_active") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "healing_contents" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "healing_contents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_healing_records" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_healing_records" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "meditation_sessions" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "meditation_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7568c348c643ed13df18200e3" ON "assessments" ("user_id", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7568c348c643ed13df18200e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "meditation_sessions" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "meditation_sessions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_healing_records" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_healing_records" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "healing_contents" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "healing_contents" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a825470e8b0a92220df7b38d35"`,
    );
    await queryRunner.query(`DROP TABLE "knowledge_base"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6eee42ad33e7bba628db00c9cf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3b0ea9b3c2185be4026dc9cc86"`,
    );
    await queryRunner.query(`DROP TABLE "risk_alerts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2da562a5161d38d922698afbc5"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_patients"`);
    await queryRunner.query(`DROP TABLE "post_likes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa9f443425b4d5c0b0ffc8a01d"`,
    );
    await queryRunner.query(`DROP TABLE "community_comments"`);
    await queryRunner.query(`DROP TABLE "post_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27cd3054507a0982a5ac701ef0"`,
    );
    await queryRunner.query(`DROP TABLE "community_posts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a48e192ed92e80352cde0f675"`,
    );
    await queryRunner.query(`DROP TABLE "emotion_diaries"`);
    await queryRunner.query(
      `DROP TYPE "public"."emotion_diaries_emotion_level_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2692f9f4be5f710fe6ed73940"`,
    );
    await queryRunner.query(`DROP TABLE "wearable_data"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_assessments_user_id_created_at" ON "assessments" ("created_at", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_favorites_user_id" ON "user_favorites" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_healing_records_user_id" ON "user_healing_records" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_healing_contents_category" ON "healing_contents" ("category") `,
    );
  }
}
