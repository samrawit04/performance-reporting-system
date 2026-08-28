import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { KpiService } from './kpi.service';
import { CreateKpiDefinitionDto } from './dto/create-kpi-definition.dto';
import { UpdateKpiDefinitionDto } from './dto/update-kpi-definition.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/enums';

@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  // --- KPI Definitions ---

  @Get('definitions')
  findAllKpis(@Query('all') all?: string) {
    const onlyActive = all !== 'true';
    return this.kpiService.findAllKpis(onlyActive);
  }

  @Get('definitions/:id')
  findOneKpi(@Param('id', ParseUUIDPipe) id: string) {
    return this.kpiService.findKpiById(id);
  }

  @Post('definitions')
  @Roles(Role.ADMIN)
  createKpi(@Body() dto: CreateKpiDefinitionDto) {
    return this.kpiService.createKpi(dto);
  }

  @Patch('definitions/:id')
  @Roles(Role.ADMIN)
  updateKpi(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKpiDefinitionDto,
  ) {
    return this.kpiService.updateKpi(id, dto);
  }

  @Patch('definitions/:id/toggle-active')
  @Roles(Role.ADMIN)
  toggleKpiActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.kpiService.toggleKpiActive(id);
  }

  @Delete('definitions/:id')
  @Roles(Role.ADMIN)
  removeKpi(@Param('id', ParseUUIDPipe) id: string) {
    return this.kpiService.removeKpi(id);
  }

  // --- Scoring Configs ---

  @Get('config/scoring')
  getScoringConfigs() {
    return this.kpiService.getScoringConfigs();
  }

  @Put('config/scoring/:key')
  @Roles(Role.ADMIN)
  updateScoringConfig(
    @Param('key') key: string,
    @Body() body: { value: any; is_confirmed?: boolean },
  ) {
    return this.kpiService.updateScoringConfig(key, body.value, body.is_confirmed);
  }

  // --- Rating Thresholds ---

  @Get('config/rating-thresholds')
  getRatingThresholds() {
    return this.kpiService.getRatingThresholds();
  }

  @Put('config/rating-thresholds')
  @Roles(Role.ADMIN)
  updateRatingThresholds(@Body() thresholds: any[]) {
    return this.kpiService.updateRatingThresholds(thresholds);
  }
}
