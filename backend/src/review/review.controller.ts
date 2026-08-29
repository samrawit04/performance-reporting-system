import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants/enums';
import { User } from '../users/entities/user.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('reviews/queue')
  @Roles(Role.REVIEWER, Role.ADMIN)
  getQueue() {
    return this.reviewService.getReviewQueue();
  }

  @Get('submissions/:id/review')
  getReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.getReviewBySubmission(id);
  }

  @Post('submissions/:id/review')
  @Roles(Role.REVIEWER, Role.ADMIN)
  submitReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewService.submitReview(id, dto, user);
  }
}
