import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhase2Tables1724836900000 implements MigrationInterface {
  name = 'CreatePhase2Tables1724836900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."bsc_perspective_enum" AS ENUM('FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."kpi_direction_enum" AS ENUM('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."period_type_enum" AS ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."submission_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'CALCULATED', 'AI_ANALYZED', 'UNDER_REVIEW', 'APPROVED', 'FINALIZED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."file_processing_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. kpi_definitions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kpi_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "perspective" "public"."bsc_perspective_enum" NOT NULL,
        "objective" character varying NOT NULL,
        "measurement" character varying NOT NULL,
        "unit" character varying NOT NULL,
        "description" character varying,
        "direction" "public"."kpi_direction_enum" NOT NULL DEFAULT 'HIGHER_IS_BETTER',
        "weight" numeric(5,2) NOT NULL DEFAULT 1.0,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kpi_definitions_id" PRIMARY KEY ("id")
      );
    `);

    // 3. scoring_configs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scoring_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "config_key" character varying NOT NULL,
        "config_value" jsonb NOT NULL,
        "description" character varying,
        "is_confirmed" boolean NOT NULL DEFAULT false,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_scoring_configs_key" UNIQUE ("config_key"),
        CONSTRAINT "PK_scoring_configs_id" PRIMARY KEY ("id")
      );
    `);

    // 4. rating_thresholds table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rating_thresholds" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "label" character varying NOT NULL,
        "min_score" numeric(5,2) NOT NULL,
        "max_score" numeric(5,2) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_confirmed" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_rating_thresholds_id" PRIMARY KEY ("id")
      );
    `);

    // 5. uploaded_files table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "uploaded_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "uploaded_by" uuid NOT NULL,
        "original_filename" character varying NOT NULL,
        "stored_path" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "file_size" integer NOT NULL,
        "processing_status" "public"."file_processing_status_enum" NOT NULL DEFAULT 'PENDING',
        "processing_error" text,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_uploaded_files_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_uploaded_files_user" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // 6. performance_submissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "performance_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "executive_id" uuid NOT NULL,
        "submitted_by" uuid NOT NULL,
        "period_type" "public"."period_type_enum" NOT NULL DEFAULT 'MONTHLY',
        "period_start" date,
        "period_end" date,
        "period_label" character varying NOT NULL,
        "status" "public"."submission_status_enum" NOT NULL DEFAULT 'DRAFT',
        "overall_score" numeric(5,2),
        "overall_rating" character varying,
        "source_file_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_submissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_submissions_executive" FOREIGN KEY ("executive_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_submissions_submitter" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_submissions_source_file" FOREIGN KEY ("source_file_id") REFERENCES "uploaded_files"("id") ON DELETE SET NULL
      );
    `);

    // 7. performance_entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "performance_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "submission_id" uuid NOT NULL,
        "kpi_definition_id" uuid,
        "perspective" "public"."bsc_perspective_enum" NOT NULL,
        "objective" character varying NOT NULL,
        "measurement" character varying NOT NULL,
        "unit" character varying NOT NULL,
        "plan_value" numeric(10,2) NOT NULL,
        "actual_value" numeric(10,2) NOT NULL,
        "notes" text,
        "achievement_pct" numeric(6,2),
        "score" numeric(6,2),
        "rating" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_entries_submission" FOREIGN KEY ("submission_id") REFERENCES "performance_submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_entries_kpi_def" FOREIGN KEY ("kpi_definition_id") REFERENCES "kpi_definitions"("id") ON DELETE SET NULL
      );
    `);

    // 8. bsc_perspective_scores table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bsc_perspective_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "submission_id" uuid NOT NULL,
        "perspective" "public"."bsc_perspective_enum" NOT NULL,
        "average_score" numeric(5,2) NOT NULL,
        "rating" character varying NOT NULL,
        CONSTRAINT "PK_bsc_perspective_scores_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bsc_scores_submission" FOREIGN KEY ("submission_id") REFERENCES "performance_submissions"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bsc_perspective_scores";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_entries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_submissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "uploaded_files";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rating_thresholds";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scoring_configs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kpi_definitions";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."file_processing_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."submission_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."period_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."kpi_direction_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bsc_perspective_enum";`);
  }
}
