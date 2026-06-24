import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInDto } from './dto/check-in.dto';
import { VisitsService } from './visits.service';

type AuthUser = { id: string; role: UserRole };

// Check-in/out + the live board are front-desk operations (PRD §2.1).
const FRONT_DESK = [UserRole.SECURITY, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('visits')
@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get('today')
  @Roles(...FRONT_DESK)
  today() {
    return this.visits.getToday();
  }

  @Post('check-in')
  @Roles(...FRONT_DESK)
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: AuthUser) {
    return this.visits.checkIn(dto, user.id);
  }

  @Post(':id/check-out')
  @Roles(...FRONT_DESK)
  checkOut(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.visits.checkOut(id, user.id);
  }
}
