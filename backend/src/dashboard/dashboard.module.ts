import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { BSCPerspectiveScore } from '../performance/entities/bsc-perspective-score.entity';
import { User } from '../users/entities/user.entity';
import { KpiDefinition } from '../kpi/entities/kpi-definition.entity';
import { ScoringConfig } from '../kpi/entities/scoring-config.entity';
import { RatingThreshold } from '../kpi/entities/rating-threshold.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerformanceSubmission,
      BSCPerspectiveScore,
      User,
      KpiDefinition,
      ScoringConfig,
      RatingThreshold,
      AuditLog,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
