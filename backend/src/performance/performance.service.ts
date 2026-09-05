import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceSubmission } from './entities/performance-submission.entity';
import { PerformanceEntry } from './entities/performance-entry.entity';
import { BSCPerspectiveScore } from './entities/bsc-perspective-score.entity';
import { CalculationService } from './calculation.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { Role, SubmissionStatus } from '../common/constants/enums';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
    @InjectRepository(PerformanceEntry)
    private readonly entryRepo: Repository<PerformanceEntry>,
    @InjectRepository(BSCPerspectiveScore)
    private readonly bscScoreRepo: Repository<BSCPerspectiveScore>,
    private readonly calculationService: CalculationService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async createSubmission(
    dto: CreateSubmissionDto,
    currentUser: User,
  ): Promise<PerformanceSubmission> {
    const executiveId =
      currentUser.role === Role.ADMIN && dto.executive_id
        ? dto.executive_id
        : currentUser.id;

    // Create submission record
    const submission = this.submissionRepo.create({
      executive_id: executiveId,
      submitted_by: currentUser.id,
      period_type: dto.period_type,
      period_start: dto.period_start ? new Date(dto.period_start) : undefined,
      period_end: dto.period_end ? new Date(dto.period_end) : undefined,
      period_label: dto.period_label,
      source_file_id: dto.source_file_id,
      status: SubmissionStatus.DRAFT,
    });

    const savedSubmission = await this.submissionRepo.save(submission);

    // Create entry records
    if (dto.entries && dto.entries.length > 0) {
      const entryEntities = dto.entries.map((e) =>
        this.entryRepo.create({
          ...e,
          submission_id: savedSubmission.id,
        }),
      );

      await this.entryRepo.save(entryEntities);
      await this.recalculate(savedSubmission.id);
    }

    this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'SUBMISSION_CREATED',
      entity: 'PerformanceSubmission',
      entityId: savedSubmission.id,
      details: {
        period_label: savedSubmission.period_label,
        entries_count: dto.entries?.length || 0,
      },
    });

    return this.findById(savedSubmission.id, currentUser);
  }

  async findAll(currentUser: User): Promise<PerformanceSubmission[]> {
    const query = this.submissionRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.executive', 'executive')
      .leftJoinAndSelect('sub.submitter', 'submitter')
      .leftJoinAndSelect('sub.perspective_scores', 'perspective_scores')
      .orderBy('sub.created_at', 'DESC');

    // Scoped by role: Managers only see their own submissions
    if (currentUser.role === Role.MANAGER) {
      query.where('sub.executive_id = :userId OR sub.submitted_by = :userId', {
        userId: currentUser.id,
      });
    }

    return query.getMany();
  }

  async findById(id: string, currentUser?: User): Promise<PerformanceSubmission> {
    const submission = await this.submissionRepo.findOne({
      where: { id },
      relations: ['executive', 'submitter', 'entries', 'perspective_scores'],
    });

    if (!submission) {
      throw new NotFoundException(`Performance submission with ID ${id} not found`);
    }

    // Permission check for managers
    if (
      currentUser &&
      currentUser.role === Role.MANAGER &&
      submission.executive_id !== currentUser.id &&
      submission.submitted_by !== currentUser.id
    ) {
      throw new ForbiddenException('You do not have access to view this submission');
    }

    return submission;
  }

  async updateEntries(
    id: string,
    entriesDto: CreateEntryDto[],
    currentUser: User,
  ): Promise<PerformanceSubmission> {
    const submission = await this.findById(id, currentUser);

    if (
      submission.status !== SubmissionStatus.DRAFT &&
      submission.status !== SubmissionStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Cannot edit entries of a submission with status "${submission.status}".`,
      );
    }

    // Remove existing entries
    await this.entryRepo.delete({ submission_id: id });

    // Save new entries
    const newEntries = entriesDto.map((e) =>
      this.entryRepo.create({
        ...e,
        submission_id: id,
      }),
    );
    await this.entryRepo.save(newEntries);

    // Recalculate
    await this.recalculate(id);

    this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'SUBMISSION_UPDATED',
      entity: 'PerformanceSubmission',
      entityId: id,
      details: { entries_count: entriesDto.length },
    });

    return this.findById(id, currentUser);
  }

  async recalculate(submissionId: string): Promise<PerformanceSubmission> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['entries'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Run calculations
    const result = await this.calculationService.calculateSubmission(
      submission.entries,
    );

    // Save all calculated entries in a single batch call (avoids N+1 sequential writes)
    await this.entryRepo.save(result.entries);

    // Replace BSC perspective scores with explicit submission_id
    await this.bscScoreRepo.delete({ submission_id: submissionId });
    if (result.perspectiveScores && result.perspectiveScores.length > 0) {
      const bscEntities = result.perspectiveScores.map((bsc) =>
        this.bscScoreRepo.create({
          perspective: bsc.perspective,
          average_score: bsc.average_score,
          rating: bsc.rating,
          submission_id: submissionId,
        }),
      );
      await this.bscScoreRepo.save(bscEntities);
    }

    // Update overall scores on submission
    await this.submissionRepo.update(submissionId, {
      overall_score: result.overallScore,
      overall_rating: result.overallRating,
    });

    this.auditService.log({
      action: 'SCORES_CALCULATED',
      entity: 'PerformanceSubmission',
      entityId: submissionId,
      details: {
        overall_score: result.overallScore,
        overall_rating: result.overallRating,
      },
    });

    return this.findById(submissionId);
  }

  async submitForReview(id: string, currentUser: User): Promise<PerformanceSubmission> {
    const submission = await this.findById(id, currentUser);

    if (submission.entries.length === 0) {
      throw new BadRequestException('Cannot submit a performance report with 0 KPI entries.');
    }

    // Recalculate to ensure all calculations are fresh
    await this.recalculate(id);

    // Transition status to CALCULATED (ready for AI analysis in Phase 3)
    await this.submissionRepo.update(id, {
      status: SubmissionStatus.CALCULATED,
    });

    this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'SUBMISSION_SUBMITTED',
      entity: 'PerformanceSubmission',
      entityId: id,
      details: {
        period_label: submission.period_label,
        status: SubmissionStatus.CALCULATED,
      },
    });

    // Notify CEO / Reviewers with a 7-Day Magic Link
    this.notifyReviewers(submission, currentUser).catch((err) =>
      console.warn(`Failed to notify reviewers for submission ${id}:`, err.message),
    );

    return this.findById(id, currentUser);
  }

  private async notifyReviewers(
    submission: PerformanceSubmission,
    submitter: User,
  ): Promise<void> {
    const reviewers = await this.usersService.findByRole(Role.REVIEWER);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    for (const reviewer of reviewers) {
      if (reviewer.email) {
        const magicToken = await this.authService.generateMagicLinkToken(
          reviewer.id,
          submission.id,
        );
        const magicLinkUrl = `${frontendUrl}/auth/magic-link?token=${magicToken}`;

        await this.mailService.sendSubmissionReadyForReview({
          recipientEmail: reviewer.email,
          recipientName: `${reviewer.first_name} ${reviewer.last_name}`,
          managerName: `${submitter.first_name} ${submitter.last_name}`,
          managerDepartment: submitter.department,
          submissionLabel: submission.period_label,
          overallScore: submission.overall_score ?? null,
          magicLinkUrl,
        });
      }
    }
  }

  async remove(id: string, currentUser: User): Promise<{ message: string }> {
    const submission = await this.findById(id, currentUser);
    if (
      submission.status !== SubmissionStatus.DRAFT &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new BadRequestException('Only draft submissions can be deleted.');
    }

    await this.submissionRepo.remove(submission);

    this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'SUBMISSION_DELETED',
      entity: 'PerformanceSubmission',
      entityId: id,
      details: { period_label: submission.period_label },
    });

    return { message: 'Submission deleted successfully.' };
  }
}
