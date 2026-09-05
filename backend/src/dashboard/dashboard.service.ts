import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { BSCPerspectiveScore } from '../performance/entities/bsc-perspective-score.entity';
import { User } from '../users/entities/user.entity';
import { KpiDefinition } from '../kpi/entities/kpi-definition.entity';
import { ScoringConfig } from '../kpi/entities/scoring-config.entity';
import { RatingThreshold } from '../kpi/entities/rating-threshold.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { SubmissionStatus, BscPerspective } from '../common/constants/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
    @InjectRepository(BSCPerspectiveScore)
    private readonly perspectiveScoreRepo: Repository<BSCPerspectiveScore>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(KpiDefinition)
    private readonly kpiRepo: Repository<KpiDefinition>,
    @InjectRepository(ScoringConfig)
    private readonly configRepo: Repository<ScoringConfig>,
    @InjectRepository(RatingThreshold)
    private readonly ratingThresholdRepo: Repository<RatingThreshold>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getManagerDashboard(userId: string) {
    // 1. Get recent submissions for this user / executive
    const submissions = await this.submissionRepo.find({
      where: [{ submitted_by: userId }, { executive_id: userId }],
      relations: ['perspective_scores', 'executive'],
      order: { created_at: 'DESC' },
      take: 10,
    });

    // 2. Latest evaluated/approved or calculated submission
    const latestWithScores = submissions.find(
      (s) => s.overall_score !== null && s.overall_score !== undefined,
    );

    // 3. BSC Radar data for the latest submission
    const defaultRadar = [
      { perspective: BscPerspective.FINANCIAL, label: 'Financial', score: 0, rating: 'N/A' },
      { perspective: BscPerspective.CUSTOMER, label: 'Customer', score: 0, rating: 'N/A' },
      { perspective: BscPerspective.INTERNAL_PROCESS, label: 'Internal Process', score: 0, rating: 'N/A' },
      { perspective: BscPerspective.LEARNING_GROWTH, label: 'Learning & Growth', score: 0, rating: 'N/A' },
    ];

    const radarScores = latestWithScores?.perspective_scores?.length
      ? defaultRadar.map((item) => {
          const match = latestWithScores.perspective_scores.find(
            (p) => p.perspective === item.perspective,
          );
          return {
            perspective: item.perspective,
            label: item.label,
            score: match ? Number(match.average_score) : 0,
            rating: match ? match.rating : 'N/A',
          };
        })
      : defaultRadar;

    // 4. Performance trends (last 6 submissions with scores, chronological)
    const scoredSubmissions = submissions
      .filter((s) => s.overall_score !== null && s.overall_score !== undefined)
      .slice(0, 6)
      .reverse();

    const trends = scoredSubmissions.map((s) => ({
      id: s.id,
      label: s.period_label || 'Period',
      overallScore: Number(s.overall_score),
      rating: s.overall_rating || 'N/A',
      status: s.status,
      date: s.created_at,
    }));

    // 5. Status distribution
    const statusCounts = {
      draft: submissions.filter((s) => s.status === SubmissionStatus.DRAFT).length,
      calculated: submissions.filter((s) => s.status === SubmissionStatus.CALCULATED).length,
      underReview: submissions.filter(
        (s) =>
          s.status === SubmissionStatus.UNDER_REVIEW ||
          s.status === SubmissionStatus.AI_ANALYZED ||
          s.status === SubmissionStatus.SUBMITTED,
      ).length,
      approved: submissions.filter(
        (s) => s.status === SubmissionStatus.APPROVED || s.status === SubmissionStatus.FINALIZED,
      ).length,
    };

    return {
      latestScore: latestWithScores
        ? {
            id: latestWithScores.id,
            overallScore: Number(latestWithScores.overall_score),
            overallRating: latestWithScores.overall_rating,
            periodLabel: latestWithScores.period_label,
            status: latestWithScores.status,
          }
        : null,
      radarScores,
      trends,
      statusCounts,
      recentSubmissions: submissions.slice(0, 5).map((s) => ({
        id: s.id,
        periodLabel: s.period_label,
        status: s.status,
        overallScore: s.overall_score ? Number(s.overall_score) : null,
        overallRating: s.overall_rating || null,
        createdAt: s.created_at,
      })),
    };
  }

  async getReviewerDashboard() {
    // Single query that loads all submissions with relations.
    // We derive pending, statusCounts, approved, and ratingDistribution from this
    // one result set — eliminating the previous double full-table scan.
    const allSubmissions = await this.submissionRepo.find({
      relations: ['executive', 'submitter', 'perspective_scores'],
      order: { created_at: 'ASC' },
    });

    // Pending reviews derived from the single query result
    const pendingSubmissions = allSubmissions.filter((s) =>
      s.status === SubmissionStatus.UNDER_REVIEW ||
      s.status === SubmissionStatus.AI_ANALYZED ||
      s.status === SubmissionStatus.CALCULATED,
    );

    const statusCounts = {
      draft: allSubmissions.filter((s) => s.status === SubmissionStatus.DRAFT).length,
      calculated: allSubmissions.filter((s) => s.status === SubmissionStatus.CALCULATED).length,
      underReview: allSubmissions.filter(
        (s) =>
          s.status === SubmissionStatus.UNDER_REVIEW ||
          s.status === SubmissionStatus.AI_ANALYZED ||
          s.status === SubmissionStatus.SUBMITTED,
      ).length,
      approved: allSubmissions.filter(
        (s) => s.status === SubmissionStatus.APPROVED || s.status === SubmissionStatus.FINALIZED,
      ).length,
      total: allSubmissions.length,
    };

    // Organization average score from approved evaluations
    const approvedSubmissions = allSubmissions.filter(
      (s) => s.status === SubmissionStatus.APPROVED && s.overall_score !== null,
    );

    const avgOrgScore = approvedSubmissions.length
      ? Number(
          (
            approvedSubmissions.reduce((acc, curr) => acc + Number(curr.overall_score), 0) /
            approvedSubmissions.length
          ).toFixed(2),
        )
      : null;

    // Rating distribution
    const ratingDistribution: Record<string, number> = {};
    allSubmissions.forEach((s) => {
      if (s.overall_rating) {
        ratingDistribution[s.overall_rating] = (ratingDistribution[s.overall_rating] || 0) + 1;
      }
    });

    return {
      pendingReviewsCount: pendingSubmissions.length,
      pendingReviews: pendingSubmissions.map((s) => ({
        id: s.id,
        executiveName: s.executive
          ? `${s.executive.first_name} ${s.executive.last_name}`
          : 'Unknown',
        periodLabel: s.period_label,
        overallScore: s.overall_score ? Number(s.overall_score) : null,
        overallRating: s.overall_rating || null,
        status: s.status,
        createdAt: s.created_at,
      })),
      statusCounts,
      avgOrgScore,
      ratingDistribution,
      recentApproved: approvedSubmissions.slice(0, 5).map((s) => ({
        id: s.id,
        executiveName: s.executive
          ? `${s.executive.first_name} ${s.executive.last_name}`
          : 'Unknown',
        periodLabel: s.period_label,
        overallScore: Number(s.overall_score),
        overallRating: s.overall_rating,
        approvedAt: s.updated_at,
      })),
    };
  }

  async getAdminDashboard() {
    // All 7 DB calls run in parallel — no sequential waiting.
    const [
      totalUsers,
      totalKpis,
      totalSubmissions,
      pendingReviewsCount,
      users,
      scoringConfigs,
      ratingThresholds,
      recentAuditLogs,
    ] = await Promise.all([
      this.userRepo.count(),
      this.kpiRepo.count({ where: { is_active: true } }),
      this.submissionRepo.count(),
      this.submissionRepo.count({
        where: [
          { status: SubmissionStatus.UNDER_REVIEW },
          { status: SubmissionStatus.AI_ANALYZED },
          { status: SubmissionStatus.CALCULATED },
        ],
      }),
      this.userRepo.find(),
      this.configRepo.find(),
      this.ratingThresholdRepo.find(),
      this.auditRepo.find({ order: { createdAt: 'DESC' }, take: 6 }),
    ]);

    const usersByRole = {
      admin: users.filter((u) => u.role === 'ADMIN').length,
      manager: users.filter((u) => u.role === 'MANAGER').length,
      reviewer: users.filter((u) => u.role === 'REVIEWER').length,
    };

    const hasUnconfirmedConfig =
      scoringConfigs.some((c) => !c.is_confirmed) ||
      ratingThresholds.some((r) => !r.is_confirmed);

    return {
      platformStats: {
        totalUsers,
        totalKpis,
        totalSubmissions,
        pendingReviewsCount,
        usersByRole,
      },
      systemHealth: {
        hasUnconfirmedConfig,
        scoringConfigCount: scoringConfigs.length,
        ratingThresholdCount: ratingThresholds.length,
      },
      recentAuditLogs,
    };
  }
}
