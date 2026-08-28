import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpiDefinition } from './entities/kpi-definition.entity';
import { ScoringConfig } from './entities/scoring-config.entity';
import { RatingThreshold } from './entities/rating-threshold.entity';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';
import { KpiSeedService } from './kpi-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KpiDefinition,
      ScoringConfig,
      RatingThreshold,
    ]),
  ],
  controllers: [KpiController],
  providers: [KpiService, KpiSeedService],
  exports: [KpiService, TypeOrmModule],
})
export class KpiModule {}
