import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiAnalysis } from './entities/ai-analysis.entity';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':id/generate-ai-analysis')
  generate(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiService.generateAnalysis(id);
  }

  @Get(':id/ai-analysis')
  getAnalysis(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiService.getAnalysisBySubmission(id);
  }

  @Patch(':id/ai-analysis')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<AiAnalysis>,
  ) {
    return this.aiService.updateAnalysis(id, body);
  }
}
