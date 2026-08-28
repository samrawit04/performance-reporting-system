import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * TypeORM DataSource for CLI operations (migrations).
 * This is used by `typeorm` CLI commands, NOT by NestJS at runtime.
 * NestJS uses TypeOrmModule.forRootAsync() in app.module.ts.
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
