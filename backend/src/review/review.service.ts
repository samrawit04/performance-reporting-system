import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewFeedback } from './entities/review-feedback.entity';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewAction, SubmissionStatus } from '../common/constants/enums';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { ReportService } from '../report/report.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(ReviewFeedback)
    private readonly reviewFeedbackRepo: Repository<ReviewFeedback>,
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly reportService: ReportService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async getReviewQueue(): Promise<PerformanceSubmission[]> {
    return this.submissionRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.executive', 'executive')
      .leftJoinAndSelect('sub.submitter', 'submitter')
      .leftJoinAndSelect('sub.perspective_scores', 'perspective_scores')
      .where('sub.status IN (:...statuses)', {
        statuses: [
          SubmissionStatus.CALCULATED,
          SubmissionStatus.AI_ANALYZED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.APPROVED,
        ],
      })
      .orderBy('sub.created_at', 'DESC')
      .getMany();
  }

  async getReviewBySubmission(submissionId: string): Promise<ReviewFeedback | null> {
    return this.reviewFeedbackRepo.findOne({
      where: { submission_id: submissionId },
      relations: ['reviewer'],
    });
  }

  async submitReview(
    submissionId: string,
    dto: SubmitReviewDto,
    reviewer: User,
  ): Promise<ReviewFeedback> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['executive', 'submitter'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    // Upsert review feedback
    let feedback = await this.reviewFeedbackRepo.findOne({
      where: { submission_id: submissionId },
    });

    if (!feedback) {
      feedback = this.reviewFeedbackRepo.create({
        submission_id: submissionId,
        reviewer_id: reviewer.id,
        action: dto.action,
        overall_feedback: dto.overall_feedback,
        perspective_feedback: dto.perspective_feedback || {},
        recommended_focus_areas: dto.recommended_focus_areas || [],
      });
    } else {
      feedback.reviewer_id = reviewer.id;
      feedback.action = dto.action;
      feedback.overall_feedback = dto.overall_feedback;
      feedback.perspective_feedback = dto.perspective_feedback || {};
      feedback.recommended_focus_areas = dto.recommended_focus_areas || [];
    }

    const savedFeedback = await this.reviewFeedbackRepo.save(feedback);

    // Update submission status based on action
    let newStatus: SubmissionStatus = submission.status;
    if (dto.action === ReviewAction.APPROVED) {
      newStatus = SubmissionStatus.APPROVED;
    } else if (dto.action === ReviewAction.RETURNED) {
      newStatus = SubmissionStatus.UNDER_REVIEW;
    }

    await this.submissionRepo.update(submissionId, { status: newStatus });

    this.auditService.log({
      userId: reviewer.id,
      userEmail: reviewer.email,
      userRole: reviewer.role,
      action: dto.action === ReviewAction.APPROVED ? 'REPORT_APPROVED' : 'REVIEW_RETURNED',
      entity: 'PerformanceSubmission',
      entityId: submissionId,
      details: {
        action: dto.action,
        overall_feedback: dto.overall_feedback,
        period_label: submission.period_label,
      },
    });

    const recipient = submission.submitter || submission.executive;

    if (recipient?.email) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const magicToken = await this.authService.generateMagicLinkToken(
        recipient.id,
        submissionId,
      );
      const magicLinkUrl = `${frontendUrl}/auth/magic-link?token=${magicToken}`;

      if (dto.action === ReviewAction.APPROVED) {
        // On APPROVAL: generate PDF and send rich HTML email with PDF attachment
        this.sendApprovalEmailWithPdf(
          submissionId,
          reviewer,
          savedFeedback,
          recipient,
          magicLinkUrl,
        ).catch((err) =>
          this.logger.warn(
            `Failed to send approval email for submission ${submissionId}: ${err.message}`,
          ),
        );
      } else if (dto.action === ReviewAction.RETURNED) {
        // On RETURN: send a simple notification with magic link (no PDF)
        this.mailService.sendReviewNotification(
          recipient.email,
          `${recipient.first_name} ${recipient.last_name}`,
          submission.period_label,
          'RETURNED',
          dto.overall_feedback,
          magicLinkUrl,
        );
      }
    }

    return this.getReviewBySubmission(submissionId) as Promise<ReviewFeedback>;
  }

  /**
   * Generates the PDF report and sends it as an email attachment to the executive.
   * Runs asynchronously so the API response is not delayed.
   */
  private async sendApprovalEmailWithPdf(
    submissionId: string,
    reviewer: User,
    feedback: ReviewFeedback,
    recipient: User,
    magicLinkUrl?: string,
  ): Promise<void> {
    try {
      const { buffer, filename } =
        await this.reportService.generateReportPdf(submissionId);

      // Re-fetch submission for score data (status is now APPROVED)
      const updatedSubmission = await this.submissionRepo.findOne({
        where: { id: submissionId },
        relations: ['executive', 'submitter', 'perspective_scores'],
      });

      await this.mailService.sendApprovalWithPdf({
        recipientEmail: recipient.email,
        recipientName: `${recipient.first_name} ${recipient.last_name}`,
        reviewerName: `${reviewer.first_name} ${reviewer.last_name}`,
        submissionLabel: updatedSubmission?.period_label ?? submissionId,
        overallScore: updatedSubmission?.overall_score ?? null,
        overallRating: updatedSubmission?.overall_rating ?? null,
        feedbackSummary: feedback.overall_feedback,
        recommendedFocusAreas: feedback.recommended_focus_areas || [],
        pdfBuffer: buffer,
        pdfFilename: filename,
        magicLinkUrl,
      });

      this.logger.log(
        `Approval email with PDF report "${filename}" sent to ${recipient.email}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Error generating/sending approval PDF for submission ${submissionId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
