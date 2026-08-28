import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAnalysis } from './entities/ai-analysis.entity';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiPromptService } from './ai-prompt.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiAnalysis, PerformanceSubmission])],
  controllers: [AiController],
  providers: [AiService, AiPromptService],
  exports: [AiService, TypeOrmModule],
})
export class AiModule {}
