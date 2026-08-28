import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiAnalysesTable1724837000000 implements MigrationInterface {
  name = 'CreateAiAnalysesTable1724837000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_analyses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "submission_id" uuid NOT NULL,
        "executive_summary" text NOT NULL,
        "strengths" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "improvement_areas" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "perspective_analysis" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "recommendations" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "model_used" character varying NOT NULL DEFAULT 'gemini-2.5-flash',
        "prompt_tokens" integer,
        "completion_tokens" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_ai_analyses_submission" UNIQUE ("submission_id"),
        CONSTRAINT "PK_ai_analyses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_analyses_submission" FOREIGN KEY ("submission_id") REFERENCES "performance_submissions"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_analyses";`);
  }
}
