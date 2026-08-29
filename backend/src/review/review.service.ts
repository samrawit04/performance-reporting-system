import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewFeedback } from './entities/review-feedback.entity';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewAction, SubmissionStatus } from '../common/constants/enums';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewFeedback)
    private readonly reviewFeedbackRepo: Repository<ReviewFeedback>,
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
    private readonly mailService: MailService,
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
    if (dto.action === ReviewAction.APPROVED) {
      submission.status = SubmissionStatus.APPROVED;
    } else if (dto.action === ReviewAction.RETURNED) {
      submission.status = SubmissionStatus.UNDER_REVIEW;
    }

    await this.submissionRepo.save(submission);

    // Send email notification to submitter
    const recipient = submission.submitter || submission.executive;
    if (recipient && recipient.email) {
      this.mailService.sendReviewNotification(
        recipient.email,
        `${recipient.first_name} ${recipient.last_name}`,
        submission.period_label,
        dto.action === ReviewAction.APPROVED ? 'APPROVED' : 'RETURNED',
        dto.overall_feedback,
      );
    }

    return this.getReviewBySubmission(submissionId) as Promise<ReviewFeedback>;
  }
}
