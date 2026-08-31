import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { AiAnalysis } from '../ai/entities/ai-analysis.entity';
import { ReviewFeedback } from '../review/entities/review-feedback.entity';
import { PdfReportService } from './pdf-report.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/constants/enums';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
    @InjectRepository(AiAnalysis)
    private readonly aiAnalysisRepo: Repository<AiAnalysis>,
    @InjectRepository(ReviewFeedback)
    private readonly reviewFeedbackRepo: Repository<ReviewFeedback>,
    private readonly pdfReportService: PdfReportService,
  ) {}

  async getReportsList(currentUser: User): Promise<PerformanceSubmission[]> {
    const query = this.submissionRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.executive', 'executive')
      .leftJoinAndSelect('sub.submitter', 'submitter')
      .leftJoinAndSelect('sub.perspective_scores', 'perspective_scores')
      .orderBy('sub.created_at', 'DESC');

    // Scoped by role: Managers see own reports, Admins/Reviewers see all
    if (currentUser.role === Role.MANAGER) {
      query.where('sub.executive_id = :userId OR sub.submitted_by = :userId', {
        userId: currentUser.id,
      });
    }

    return query.getMany();
  }

  async getReportData(id: string, currentUser?: User) {
    const submission = await this.submissionRepo.findOne({
      where: { id },
      relations: ['executive', 'submitter', 'entries', 'perspective_scores'],
    });

    if (!submission) {
      throw new NotFoundException(`Performance submission ${id} not found`);
    }

    // Role check for managers
    if (
      currentUser &&
      currentUser.role === Role.MANAGER &&
      submission.executive_id !== currentUser.id &&
      submission.submitted_by !== currentUser.id
    ) {
      throw new ForbiddenException('Access to this report is restricted');
    }

    const aiAnalysis = await this.aiAnalysisRepo.findOne({
      where: { submission_id: id },
    });

    const reviewFeedback = await this.reviewFeedbackRepo.findOne({
      where: { submission_id: id },
      relations: ['reviewer'],
    });

    return {
      submission,
      aiAnalysis,
      reviewFeedback,
    };
  }

  async generateReportPdf(
    id: string,
    currentUser?: User,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const { submission, aiAnalysis, reviewFeedback } =
      await this.getReportData(id, currentUser);

    const pdfBuffer = await this.pdfReportService.generateExecutiveReportPdf(
      submission,
      aiAnalysis,
      reviewFeedback,
    );

    const safePeriod = (submission.period_label || 'Report').replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );
    const safeName = (
      submission.executive
        ? `${submission.executive.first_name}_${submission.executive.last_name}`
        : 'Executive'
    ).replace(/[^a-zA-Z0-9_-]/g, '_');

    const filename = `Executive_Performance_Report_${safePeriod}_${safeName}.pdf`;

    return {
      buffer: pdfBuffer,
      filename,
    };
  }
}
