import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { SubmissionStatus, PeriodType, BscPerspective } from '../common/constants/enums';

export interface PeriodSummary {
  periodLabel: string;
  overallScore: number | null;
  overallRating: string | null;
  perspectiveScores: Record<string, number>;
  status: SubmissionStatus;
  submissionId: string;
}

export interface QuarterSummary {
  quarter: string; // e.g. "Q1"
  months: PeriodSummary[];
  avgScore: number | null;
  avgPerspectiveScores: Record<string, number>;
}

export interface ManagerAggregation {
  year: number;
  executiveName: string;
  monthly: PeriodSummary[];
  quarterly: QuarterSummary[];
  yearlyAvgScore: number | null;
  yearlyPerspectiveScores: Record<string, number>;
}

export interface OrgOverview {
  year: number;
  managers: {
    userId: string;
    name: string;
    department?: string;
    yearlyAvgScore: number | null;
    overallRating: string | null;
    submissionCount: number;
  }[];
}

@Injectable()
export class AggregationService {
  constructor(
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
  ) {}

  private getQuarter(periodLabel: string): string {
    // Detect month from labels like "Monthly — 2026-01" or "January 2026"
    const monthMatch = periodLabel.match(
      /(\d{4})-(\d{2})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    );
    if (!monthMatch) return 'Q4';

    let month: number;
    if (monthMatch[2]) {
      month = parseInt(monthMatch[2], 10);
    } else {
      const names = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      month = names.findIndex((n) => monthMatch[0].toLowerCase().startsWith(n)) + 1;
    }

    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  }

  private extractYear(periodLabel: string): number | null {
    const match = periodLabel.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  }

  async getManagerAggregation(
    userId: string,
    year: number,
  ): Promise<ManagerAggregation> {
    const submissions = await this.submissionRepo.find({
      where: [
        { submitted_by: userId, period_type: PeriodType.MONTHLY },
        { executive_id: userId, period_type: PeriodType.MONTHLY },
      ],
      relations: ['executive', 'perspective_scores'],
      order: { created_at: 'ASC' },
    });

    // Filter to requested year
    const yearSubmissions = submissions.filter((s) => {
      const y = this.extractYear(s.period_label);
      return y === year;
    });

    const executiveName = submissions[0]?.executive
      ? `${submissions[0].executive.first_name} ${submissions[0].executive.last_name}`
      : 'Unknown';

    // Build monthly summaries
    const monthly: PeriodSummary[] = yearSubmissions.map((s) => {
      const perspectiveScores: Record<string, number> = {};
      for (const ps of s.perspective_scores || []) {
        perspectiveScores[ps.perspective] = Number(ps.average_score);
      }
      return {
        periodLabel: s.period_label,
        overallScore: s.overall_score ? Number(s.overall_score) : null,
        overallRating: s.overall_rating || null,
        perspectiveScores,
        status: s.status,
        submissionId: s.id,
      };
    });

    // Group by quarter
    const quarterMap: Record<string, PeriodSummary[]> = { Q1: [], Q2: [], Q3: [], Q4: [] };
    for (const m of monthly) {
      const q = this.getQuarter(m.periodLabel);
      quarterMap[q].push(m);
    }

    const perspectives = Object.values(BscPerspective);

    const quarterly: QuarterSummary[] = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
      const months = quarterMap[q];
      const scoredMonths = months.filter((m) => m.overallScore !== null);

      const avgScore =
        scoredMonths.length > 0
          ? Number(
              (
                scoredMonths.reduce((s, m) => s + (m.overallScore || 0), 0) /
                scoredMonths.length
              ).toFixed(2),
            )
          : null;

      // Average per-perspective across the quarter's months
      const avgPerspectiveScores: Record<string, number> = {};
      for (const p of perspectives) {
        const pScores = scoredMonths
          .map((m) => m.perspectiveScores[p])
          .filter((v) => v !== undefined);
        if (pScores.length > 0) {
          avgPerspectiveScores[p] = Number(
            (pScores.reduce((s, v) => s + v, 0) / pScores.length).toFixed(2),
          );
        }
      }

      return { quarter: q, months, avgScore, avgPerspectiveScores };
    });

    // Yearly averages
    const scoredQuarters = quarterly.filter((q) => q.avgScore !== null);
    const yearlyAvgScore =
      scoredQuarters.length > 0
        ? Number(
            (
              scoredQuarters.reduce((s, q) => s + (q.avgScore || 0), 0) /
              scoredQuarters.length
            ).toFixed(2),
          )
        : null;

    const yearlyPerspectiveScores: Record<string, number> = {};
    for (const p of perspectives) {
      const pScores = scoredQuarters
        .map((q) => q.avgPerspectiveScores[p])
        .filter((v) => v !== undefined);
      if (pScores.length > 0) {
        yearlyPerspectiveScores[p] = Number(
          (pScores.reduce((s, v) => s + v, 0) / pScores.length).toFixed(2),
        );
      }
    }

    return {
      year,
      executiveName,
      monthly,
      quarterly,
      yearlyAvgScore,
      yearlyPerspectiveScores,
    };
  }

  async getOrgOverview(year: number): Promise<OrgOverview> {
    const allSubmissions = await this.submissionRepo.find({
      where: { period_type: PeriodType.MONTHLY },
      relations: ['executive'],
      order: { created_at: 'ASC' },
    });

    // Filter by year
    const yearSubs = allSubmissions.filter((s) => {
      const y = this.extractYear(s.period_label);
      return y === year;
    });

    // Group by executive
    const execMap: Record<string, PerformanceSubmission[]> = {};
    for (const s of yearSubs) {
      const key = s.executive_id;
      if (!execMap[key]) execMap[key] = [];
      execMap[key].push(s);
    }

    const managers = Object.entries(execMap).map(([userId, subs]) => {
      const exec = subs[0]?.executive;
      const scored = subs.filter(
        (s) => s.overall_score !== null && s.overall_score !== undefined,
      );
      const yearlyAvgScore =
        scored.length > 0
          ? Number(
              (
                scored.reduce((s, sub) => s + Number(sub.overall_score), 0) /
                scored.length
              ).toFixed(2),
            )
          : null;

      // Determine rating label
      let overallRating: string | null = null;
      if (yearlyAvgScore !== null) {
        if (yearlyAvgScore >= 90) overallRating = 'Excellent';
        else if (yearlyAvgScore >= 75) overallRating = 'Good';
        else if (yearlyAvgScore >= 60) overallRating = 'Satisfactory';
        else overallRating = 'Needs Improvement';
      }

      return {
        userId,
        name: exec ? `${exec.first_name} ${exec.last_name}` : 'Unknown',
        department: exec?.department || undefined,
        yearlyAvgScore,
        overallRating,
        submissionCount: subs.length,
      };
    });

    return { year, managers };
  }
}
