import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { AiAnalysis } from '../ai/entities/ai-analysis.entity';
import { ReviewFeedback } from '../review/entities/review-feedback.entity';
import { ReportService } from './report.service';
import { PdfReportService } from './pdf-report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerformanceSubmission,
      AiAnalysis,
      ReviewFeedback,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService, PdfReportService],
  exports: [ReportService, PdfReportService],
})
export class ReportModule {}
