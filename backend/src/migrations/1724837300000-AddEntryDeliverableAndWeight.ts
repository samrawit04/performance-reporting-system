import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntryDeliverableAndWeight1724837300000
  implements MigrationInterface
{
  name = 'AddEntryDeliverableAndWeight1724837300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deliverable column (nullable text)
    await queryRunner.query(`
      ALTER TABLE "performance_entries"
      ADD COLUMN IF NOT EXISTS "deliverable" text
    `);

    // Add weight column (decimal, default 1.0)
    await queryRunner.query(`
      ALTER TABLE "performance_entries"
      ADD COLUMN IF NOT EXISTS "weight" numeric(5,2) NOT NULL DEFAULT 1.0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "performance_entries" DROP COLUMN IF EXISTS "deliverable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance_entries" DROP COLUMN IF EXISTS "weight"`,
    );
  }
}
