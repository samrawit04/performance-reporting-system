import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1724837200000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1724837200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "user_email" character varying(255),
        "user_role" character varying(50),
        "action" character varying(100) NOT NULL,
        "entity" character varying(100) NOT NULL,
        "entity_id" character varying(255),
        "details" jsonb,
        "ip_address" character varying(45),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_user_id" ON "audit_logs" ("user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action" ON "audit_logs" ("action");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity" ON "audit_logs" ("entity");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity_id" ON "audit_logs" ("entity_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_created_at" ON "audit_logs" ("created_at");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_entity_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_entity";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_action";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_user_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs";`);
  }
}
