import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewFeedback } from './entities/review-feedback.entity';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MailModule } from '../mail/mail.module';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewFeedback, PerformanceSubmission]),
    MailModule,
    ReportModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService, TypeOrmModule],
})
export class ReviewModule {}
