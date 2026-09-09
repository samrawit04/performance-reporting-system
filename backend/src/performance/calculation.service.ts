import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoringConfig } from '../kpi/entities/scoring-config.entity';
import { RatingThreshold } from '../kpi/entities/rating-threshold.entity';
import { PerformanceEntry } from './entities/performance-entry.entity';
import { BSCPerspectiveScore } from './entities/bsc-perspective-score.entity';
import { BscPerspective } from '../common/constants/enums';

export interface CalculationResult {
  entries: PerformanceEntry[];
  perspectiveScores: Partial<BSCPerspectiveScore>[];
  overallScore: number;
  overallRating: string;
}

/** Simple in-memory cache entry */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * TTL for the scoring config / rating thresholds cache in milliseconds (5s).
 */
const CONFIG_CACHE_TTL_MS = 5 * 1000;

@Injectable()
export class CalculationService {
  constructor(
    @InjectRepository(ScoringConfig)
    private readonly scoringConfigRepo: Repository<ScoringConfig>,
    @InjectRepository(RatingThreshold)
    private readonly ratingThresholdRepo: Repository<RatingThreshold>,
  ) {}

  // ─── In-memory caches ────────────────────────────────────────────────────────
  private scoringConfigCache: CacheEntry<ScoringConfig[]> | null = null;
  private ratingThresholdCache: CacheEntry<RatingThreshold[]> | null = null;

  /**
   * Returns scoring configs from cache, refreshing if expired.
   * Avoids a DB round-trip on every submission calculation.
   */
  private async getScoringConfigs(): Promise<ScoringConfig[]> {
    const now = Date.now();
    if (this.scoringConfigCache && now < this.scoringConfigCache.expiresAt) {
      return this.scoringConfigCache.data;
    }
    const data = await this.scoringConfigRepo.find();
    this.scoringConfigCache = { data, expiresAt: now + CONFIG_CACHE_TTL_MS };
    return data;
  }

  /**
   * Returns rating thresholds from cache, refreshing if expired.
   */
  private async getRatingThresholds(): Promise<RatingThreshold[]> {
    const now = Date.now();
    if (this.ratingThresholdCache && now < this.ratingThresholdCache.expiresAt) {
      return this.ratingThresholdCache.data;
    }
    const data = await this.ratingThresholdRepo.find({ order: { min_score: 'DESC' } });
    this.ratingThresholdCache = { data, expiresAt: now + CONFIG_CACHE_TTL_MS };
    return data;
  }

  /**
   * Call this whenever an admin updates scoring config or rating thresholds
   * so the cache is invalidated immediately.
   */
  invalidateConfigCache(): void {
    this.scoringConfigCache = null;
    this.ratingThresholdCache = null;
  }

  async calculateSubmission(
    entries: PerformanceEntry[],
  ): Promise<CalculationResult> {
    if (!entries || entries.length === 0) {
      return {
        entries: [],
        perspectiveScores: [],
        overallScore: 0,
        overallRating: 'Needs Improvement',
      };
    }

    // 1. Fetch dynamic scoring configs & thresholds (served from cache when available)
    const [scoringConfigs, thresholds] = await Promise.all([
      this.getScoringConfigs(),
      this.getRatingThresholds(),
    ]);

    const configMap: Record<string, any> = {};
    for (const c of scoringConfigs) {
      configMap[c.config_key] = c.config_value?.value ?? c.config_value;
    }

    const scoreCap = Number(configMap['score_cap'] ?? 100);
    const perspectiveWeights: Record<string, number> =
      configMap['perspective_weights'] ?? {
        FINANCIAL: 0.25,
        CUSTOMER: 0.25,
        INTERNAL_PROCESS: 0.25,
        LEARNING_GROWTH: 0.25,
      };

    // Helper: Lookup rating label for a score
    const getRating = (score: number): string => {
      const match = thresholds.find(
        (t) => score >= Number(t.min_score) && score <= Number(t.max_score),
      );
      return match ? match.label : score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : 'Needs Improvement';
    };

    // 2. Step 1: Calculate per-KPI entry results
    const calculatedEntries = entries.map((entry) => {
      const plan = Number(entry.plan_value);
      const actual = Number(entry.actual_value);

      let achvPct = 0;
      if (plan !== 0) {
        achvPct = Number(((actual / plan) * 100).toFixed(2));
      }

      // Score is capped by scoreCap
      const score = Number(Math.min(achvPct, scoreCap).toFixed(2));
      const rating = getRating(score);

      entry.achievement_pct = achvPct;
      entry.score = score;
      entry.rating = rating;

      return entry;
    });

    // 3. Step 2: Aggregate BSC perspective scores
    const perspectives = [
      BscPerspective.FINANCIAL,
      BscPerspective.CUSTOMER,
      BscPerspective.INTERNAL_PROCESS,
      BscPerspective.LEARNING_GROWTH,
    ];

    const perspectiveScores: Partial<BSCPerspectiveScore>[] = [];
    const perspectiveScoreMap: Partial<Record<BscPerspective, number>> = {};

    for (const p of perspectives) {
      const pEntries = calculatedEntries.filter((e) => e.perspective === p);
      if (pEntries.length > 0) {
        // Weighted average: each KPI score × its weight, divided by total weight
        const totalWeight = pEntries.reduce(
          (sum, e) => sum + Number(e.weight ?? 1.0),
          0,
        );
        const weightedScore = pEntries.reduce(
          (sum, e) => sum + Number(e.score || 0) * Number(e.weight ?? 1.0),
          0,
        );
        const avgScore = totalWeight > 0
          ? Number((weightedScore / totalWeight).toFixed(2))
          : 0;
        const rating = getRating(avgScore);

        perspectiveScoreMap[p] = avgScore;
        perspectiveScores.push({
          perspective: p,
          average_score: avgScore,
          rating,
        });
      }
    }

    // 4. Step 3: Calculate overall score
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [p, score] of Object.entries(perspectiveScoreMap)) {
      const weight = Number(perspectiveWeights[p] ?? 0.25);
      weightedSum += score * weight;
      totalWeight += weight;
    }

    const overallScore =
      totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : 0;
    const overallRating = getRating(overallScore);

    return {
      entries: calculatedEntries,
      perspectiveScores,
      overallScore,
      overallRating,
    };
  }
}
