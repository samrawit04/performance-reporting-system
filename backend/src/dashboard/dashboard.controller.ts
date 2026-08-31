import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants/enums';
import { User } from '../users/entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('manager')
  @Roles(Role.MANAGER, Role.ADMIN)
  async getManagerDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getManagerDashboard(user.id);
  }

  @Get('reviewer')
  @Roles(Role.REVIEWER, Role.ADMIN)
  async getReviewerDashboard() {
    return this.dashboardService.getReviewerDashboard();
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}
