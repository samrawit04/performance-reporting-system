import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiDefinition } from './entities/kpi-definition.entity';
import { ScoringConfig } from './entities/scoring-config.entity';
import { RatingThreshold } from './entities/rating-threshold.entity';
import { BscPerspective, KpiDirection } from '../common/constants/enums';

@Injectable()
export class KpiSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KpiSeedService.name);

  constructor(
    @InjectRepository(KpiDefinition)
    private readonly kpiDefRepo: Repository<KpiDefinition>,
    @InjectRepository(ScoringConfig)
    private readonly scoringConfigRepo: Repository<ScoringConfig>,
    @InjectRepository(RatingThreshold)
    private readonly ratingThresholdRepo: Repository<RatingThreshold>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedScoringConfigs();
    await this.seedRatingThresholds();
    await this.seedKpiDefinitions();
  }

  async seedScoringConfigs() {
    try {
      const count = await this.scoringConfigRepo.count();
      if (count === 0) {
        this.logger.log('Seeding default scoring configurations...');

        const defaultConfigs: Partial<ScoringConfig>[] = [
          {
            config_key: 'score_cap',
            config_value: { value: 100 },
            description: 'Maximum score cap for any KPI. Achievement may exceed 100% but score is capped.',
            is_confirmed: false,
          },
          {
            config_key: 'achievement_formula',
            config_value: { value: 'actual_divided_by_plan' },
            description: 'Formula for achievement %: (actual / plan) * 100.',
            is_confirmed: false,
          },
          {
            config_key: 'perspective_weights',
            config_value: {
              FINANCIAL: 0.25,
              CUSTOMER: 0.25,
              INTERNAL_PROCESS: 0.25,
              LEARNING_GROWTH: 0.25,
            },
            description: 'Weight of each BSC perspective in calculating overall score (provisional equal weights).',
            is_confirmed: false,
          },
          {
            config_key: 'kpi_aggregation',
            config_value: { value: 'simple_average' },
            description: 'Method for aggregating KPI scores within a perspective (provisional simple average).',
            is_confirmed: false,
          },
        ];

        for (const cfg of defaultConfigs) {
          const item = this.scoringConfigRepo.create(cfg);
          await this.scoringConfigRepo.save(item);
        }

        this.logger.log('✅ Default scoring configurations seeded.');
      }
    } catch (err) {
      this.logger.warn(`Could not seed scoring configs: ${(err as Error).message}`);
    }
  }

  async seedRatingThresholds() {
    try {
      const count = await this.ratingThresholdRepo.count();
      if (count === 0) {
        this.logger.log('Seeding default rating thresholds...');

        const defaultThresholds: Partial<RatingThreshold>[] = [
          {
            label: 'Excellent',
            min_score: 90.0,
            max_score: 100.0,
            sort_order: 1,
            is_confirmed: false,
          },
          {
            label: 'Good',
            min_score: 75.0,
            max_score: 89.99,
            sort_order: 2,
            is_confirmed: false,
          },
          {
            label: 'Satisfactory',
            min_score: 60.0,
            max_score: 74.99,
            sort_order: 3,
            is_confirmed: false,
          },
          {
            label: 'Needs Improvement',
            min_score: 0.0,
            max_score: 59.99,
            sort_order: 4,
            is_confirmed: false,
          },
        ];

        for (const t of defaultThresholds) {
          const item = this.ratingThresholdRepo.create(t);
          await this.ratingThresholdRepo.save(item);
        }

        this.logger.log('✅ Default rating thresholds seeded.');
      }
    } catch (err) {
      this.logger.warn(`Could not seed rating thresholds: ${(err as Error).message}`);
    }
  }

  async seedKpiDefinitions() {
    try {
      const count = await this.kpiDefRepo.count();
      if (count === 0) {
        this.logger.log('Seeding sample KPI templates...');

        const sampleKpis: Partial<KpiDefinition>[] = [
          {
            perspective: BscPerspective.FINANCIAL,
            objective: 'Control operating cost',
            measurement: '% budget variance',
            unit: '%',
            description: 'Maintain operating expenses strictly within budgeted levels',
            direction: KpiDirection.HIGHER_IS_BETTER,
            weight: 1.0,
            sort_order: 1,
            is_active: true,
          },
          {
            perspective: BscPerspective.FINANCIAL,
            objective: 'Reduce procurement waste',
            measurement: '% material loss',
            unit: '%',
            description: 'Minimize loss and scrap in supply chain procurement',
            direction: KpiDirection.HIGHER_IS_BETTER,
            weight: 1.0,
            sort_order: 2,
            is_active: true,
          },
          {
            perspective: BscPerspective.CUSTOMER,
            objective: 'Improve client satisfaction',
            measurement: 'CSAT index score',
            unit: '%',
            description: 'Achieve high overall client satisfaction survey scores',
            direction: KpiDirection.HIGHER_IS_BETTER,
            weight: 1.0,
            sort_order: 3,
            is_active: true,
          },
          {
            perspective: BscPerspective.INTERNAL_PROCESS,
            objective: 'Reduce process turnaround',
            measurement: 'Average turnaround duration',
            unit: 'days',
            description: 'Streamline operational workflow duration and approval cycles',
            direction: KpiDirection.HIGHER_IS_BETTER,
            weight: 1.0,
            sort_order: 4,
            is_active: true,
          },
          {
            perspective: BscPerspective.LEARNING_GROWTH,
            objective: 'Grow team capability',
            measurement: 'Training hours per employee',
            unit: 'hrs',
            description: 'Invest in skill development and executive leadership growth',
            direction: KpiDirection.HIGHER_IS_BETTER,
            weight: 1.0,
            sort_order: 5,
            is_active: true,
          },
        ];

        for (const k of sampleKpis) {
          const item = this.kpiDefRepo.create(k);
          await this.kpiDefRepo.save(item);
        }

        this.logger.log('✅ Sample KPI templates seeded.');
      }
    } catch (err) {
      this.logger.warn(`Could not seed KPI definitions: ${(err as Error).message}`);
    }
  }
}
