import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/enums';

@Controller('aggregation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AggregationController {
  constructor(
    private readonly aggregationService: AggregationService,
    private readonly aiService: AiService,
  ) {}

  /** Manager fetches their own aggregation */
  @Get('me')
  @Roles(Role.MANAGER, Role.ADMIN, Role.REVIEWER)
  async getMyAggregation(
    @Request() req: any,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.aggregationService.getManagerAggregation(req.user.id, targetYear);
  }

  /** CEO / Admin fetches any manager's aggregation */
  @Get('manager/:userId')
  @Roles(Role.REVIEWER, Role.ADMIN)
  async getManagerAggregation(
    @Param('userId') userId: string,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.aggregationService.getManagerAggregation(userId, targetYear);
  }

  /** CEO / Admin org-wide overview */
  @Get('overview')
  @Roles(Role.REVIEWER, Role.ADMIN)
  async getOrgOverview(@Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.aggregationService.getOrgOverview(targetYear);
  }

  /** CEO / Admin company-wide AI macro strategic analysis */
  @Get('ai-macro-summary')
  @Roles(Role.REVIEWER, Role.ADMIN)
  async getAiMacroSummary(@Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const overview = await this.aggregationService.getOrgOverview(targetYear);
    return this.aiService.generateCompanyMacroAnalysis(overview);
  }
}
