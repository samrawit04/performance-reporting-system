import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceSubmission } from './entities/performance-submission.entity';
import { PerformanceEntry } from './entities/performance-entry.entity';
import { BSCPerspectiveScore } from './entities/bsc-perspective-score.entity';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { CalculationService } from './calculation.service';
import { KpiModule } from '../kpi/kpi.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerformanceSubmission,
      PerformanceEntry,
      BSCPerspectiveScore,
    ]),
    KpiModule,
    MailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService, CalculationService],
  exports: [PerformanceService, CalculationService, TypeOrmModule],
})
export class PerformanceModule {}
