import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestOverrideDto } from './dto/request-override.dto';
import { OverridesService } from './overrides.service';

type AuthUser = { id: string; role: UserRole };

// Security requests; Admin approves or denies (PRD §2.1, §4.8).
const REQUESTERS = [UserRole.SECURITY, UserRole.ADMIN];
const APPROVERS = [UserRole.ADMIN];

@ApiTags('overrides')
@Controller('overrides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OverridesController {
  constructor(private readonly overrides: OverridesService) {}

  @Post()
  @Roles(...REQUESTERS)
  request(@Body() dto: RequestOverrideDto, @CurrentUser() user: AuthUser) {
    return this.overrides.request(dto, user.id);
  }

  @Get()
  @Roles(...APPROVERS)
  list() {
    return this.overrides.list();
  }

  @Post(':id/approve')
  @HttpCode(200)
  @Roles(...APPROVERS)
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.overrides.approve(id, user.id);
  }

  @Post(':id/deny')
  @HttpCode(200)
  @Roles(...APPROVERS)
  deny(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.overrides.deny(id, user.id);
  }
}
