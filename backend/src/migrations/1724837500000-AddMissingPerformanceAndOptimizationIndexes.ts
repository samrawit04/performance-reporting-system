import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingPerformanceAndOptimizationIndexes1724837500000 implements MigrationInterface {
  name = 'AddMissingPerformanceAndOptimizationIndexes1724837500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. performance_submissions: index submitted_by and composite (executive_id, period_label)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_submitted_by" ON "performance_submissions" ("submitted_by");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_exec_period" ON "performance_submissions" ("executive_id", "period_label");`,
    );

    // 2. review_feedbacks: index reviewer_id
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_review_feedbacks_reviewer_id" ON "review_feedbacks" ("reviewer_id");`,
    );

    // 3. users: index department
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_department" ON "users" ("department");`,
    );

    // 4. kpi_definitions: index perspective and is_active
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_kpi_defs_perspective" ON "kpi_definitions" ("perspective");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_kpi_defs_is_active" ON "kpi_definitions" ("is_active");`,
    );

    // 5. uploaded_files: index uploaded_by and processing_status
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_uploaded_files_uploaded_by" ON "uploaded_files" ("uploaded_by");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_uploaded_files_status" ON "uploaded_files" ("processing_status");`,
    );

    // 6. bsc_perspective_scores: composite index on (submission_id, perspective)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bsc_scores_sub_perspective" ON "bsc_perspective_scores" ("submission_id", "perspective");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bsc_scores_sub_perspective";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uploaded_files_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uploaded_files_uploaded_by";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_kpi_defs_is_active";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_kpi_defs_perspective";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_department";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_review_feedbacks_reviewer_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_exec_period";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_submitted_by";`);
  }
}
