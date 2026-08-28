import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getHealth() {
    let dbStatus = 'disconnected';
    let dbLatencyMs: number | null = null;

    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'performance-reporting-backend',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'Neon PostgreSQL',
      },
    };
  }
}
