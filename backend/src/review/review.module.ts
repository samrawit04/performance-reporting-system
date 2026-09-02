import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewFeedback } from './entities/review-feedback.entity';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MailModule } from '../mail/mail.module';
import { ReportModule } from '../report/report.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewFeedback, PerformanceSubmission]),
    MailModule,
    ReportModule,
    AuthModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService, TypeOrmModule],
})
export class ReviewModule {}
