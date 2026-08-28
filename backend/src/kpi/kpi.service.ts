import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiDefinition } from './entities/kpi-definition.entity';
import { ScoringConfig } from './entities/scoring-config.entity';
import { RatingThreshold } from './entities/rating-threshold.entity';
import { CreateKpiDefinitionDto } from './dto/create-kpi-definition.dto';
import { UpdateKpiDefinitionDto } from './dto/update-kpi-definition.dto';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(KpiDefinition)
    private readonly kpiDefRepo: Repository<KpiDefinition>,
    @InjectRepository(ScoringConfig)
    private readonly scoringConfigRepo: Repository<ScoringConfig>,
    @InjectRepository(RatingThreshold)
    private readonly ratingThresholdRepo: Repository<RatingThreshold>,
  ) {}

  // --- KPI Definitions ---

  async findAllKpis(onlyActive = true): Promise<KpiDefinition[]> {
    return this.kpiDefRepo.find({
      where: onlyActive ? { is_active: true } : {},
      order: { sort_order: 'ASC', objective: 'ASC' },
    });
  }

  async findKpiById(id: string): Promise<KpiDefinition> {
    const kpi = await this.kpiDefRepo.findOne({ where: { id } });
    if (!kpi) {
      throw new NotFoundException(`KPI Definition with ID ${id} not found`);
    }
    return kpi;
  }

  async createKpi(dto: CreateKpiDefinitionDto): Promise<KpiDefinition> {
    const kpi = this.kpiDefRepo.create(dto);
    return this.kpiDefRepo.save(kpi);
  }

  async updateKpi(id: string, dto: UpdateKpiDefinitionDto): Promise<KpiDefinition> {
    const kpi = await this.findKpiById(id);
    Object.assign(kpi, dto);
    return this.kpiDefRepo.save(kpi);
  }

  async toggleKpiActive(id: string): Promise<KpiDefinition> {
    const kpi = await this.findKpiById(id);
    kpi.is_active = !kpi.is_active;
    return this.kpiDefRepo.save(kpi);
  }

  async removeKpi(id: string): Promise<{ message: string }> {
    const kpi = await this.findKpiById(id);
    kpi.is_active = false;
    await this.kpiDefRepo.save(kpi);
    return { message: `KPI definition "${kpi.objective}" deactivated.` };
  }

  // --- Scoring Configurations ---

  async getScoringConfigs(): Promise<Record<string, any>> {
    const configs = await this.scoringConfigRepo.find();
    const result: Record<string, any> = {};
    for (const c of configs) {
      result[c.config_key] = {
        value: c.config_value?.value ?? c.config_value,
        description: c.description,
        is_confirmed: c.is_confirmed,
        updated_at: c.updated_at,
      };
    }
    return result;
  }

  async updateScoringConfig(
    key: string,
    value: any,
    isConfirmed?: boolean,
  ): Promise<ScoringConfig> {
    let config = await this.scoringConfigRepo.findOne({
      where: { config_key: key },
    });

    if (!config) {
      config = this.scoringConfigRepo.create({
        config_key: key,
        config_value: typeof value === 'object' ? value : { value },
        is_confirmed: isConfirmed ?? false,
      });
    } else {
      config.config_value = typeof value === 'object' ? value : { value };
      if (isConfirmed !== undefined) {
        config.is_confirmed = isConfirmed;
      }
    }

    return this.scoringConfigRepo.save(config);
  }

  // --- Rating Thresholds ---

  async getRatingThresholds(): Promise<RatingThreshold[]> {
    return this.ratingThresholdRepo.find({
      order: { sort_order: 'ASC', min_score: 'DESC' },
    });
  }

  async updateRatingThresholds(
    thresholds: Partial<RatingThreshold>[],
  ): Promise<RatingThreshold[]> {
    const saved: RatingThreshold[] = [];
    for (const t of thresholds) {
      if (t.id) {
        const existing = await this.ratingThresholdRepo.findOne({
          where: { id: t.id },
        });
        if (existing) {
          Object.assign(existing, t);
          saved.push(await this.ratingThresholdRepo.save(existing));
        }
      } else {
        const item = this.ratingThresholdRepo.create(t);
        saved.push(await this.ratingThresholdRepo.save(item));
      }
    }
    return saved;
  }
}
