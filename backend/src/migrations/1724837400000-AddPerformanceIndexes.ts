import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1724837400000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1724837400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. performance_submissions indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_executive_id" ON "performance_submissions" ("executive_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_status" ON "performance_submissions" ("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_period_label" ON "performance_submissions" ("period_label");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_created_at" ON "performance_submissions" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_submissions_exec_status" ON "performance_submissions" ("executive_id", "status");`,
    );

    // 2. performance_entries indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entries_submission_id" ON "performance_entries" ("submission_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entries_kpi_def_id" ON "performance_entries" ("kpi_definition_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entries_perspective" ON "performance_entries" ("perspective");`,
    );

    // 3. bsc_perspective_scores indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bsc_scores_submission_id" ON "bsc_perspective_scores" ("submission_id");`,
    );

    // 4. users indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bsc_scores_submission_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_entries_perspective";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_entries_kpi_def_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_entries_submission_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_exec_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_period_label";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_submissions_executive_id";`);
  }
}
