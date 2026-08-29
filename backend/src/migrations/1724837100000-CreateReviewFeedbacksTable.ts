import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewFeedbacksTable1724837100000 implements MigrationInterface {
  name = 'CreateReviewFeedbacksTable1724837100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."review_action_enum" AS ENUM('PENDING', 'APPROVED', 'RETURNED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_feedbacks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "submission_id" uuid NOT NULL,
        "reviewer_id" uuid NOT NULL,
        "action" "public"."review_action_enum" NOT NULL DEFAULT 'APPROVED',
        "overall_feedback" text NOT NULL,
        "perspective_feedback" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "recommended_focus_areas" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_review_feedbacks_submission" UNIQUE ("submission_id"),
        CONSTRAINT "PK_review_feedbacks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_review_feedbacks_submission" FOREIGN KEY ("submission_id") REFERENCES "performance_submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_feedbacks_reviewer" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "review_feedbacks";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."review_action_enum";`);
  }
}
