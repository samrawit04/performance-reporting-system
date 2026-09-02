import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AggregationService } from './aggregation.service';
import { AggregationController } from './aggregation.controller';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceSubmission])],
  controllers: [AggregationController],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
