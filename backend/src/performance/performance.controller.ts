import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.performanceService.createSubmission(dto, currentUser);
  }

  @Get()
  findAll(@CurrentUser() currentUser: User) {
    return this.performanceService.findAll(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.performanceService.findById(id, currentUser);
  }

  @Patch(':id/entries')
  updateEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() entriesDto: CreateEntryDto[],
    @CurrentUser() currentUser: User,
  ) {
    return this.performanceService.updateEntries(id, entriesDto, currentUser);
  }

  @Post(':id/calculate')
  recalculate(@Param('id', ParseUUIDPipe) id: string) {
    return this.performanceService.recalculate(id);
  }

  @Post(':id/submit')
  submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.performanceService.submitForReview(id, currentUser);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.performanceService.remove(id, currentUser);
  }
}
