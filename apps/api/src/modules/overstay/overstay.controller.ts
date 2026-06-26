import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OverstayService } from './overstay.service';

/** Admin manual trigger for the end-of-day sweep (also runs nightly via cron). */
@ApiTags('overstay')
@Controller('overstay')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class OverstayController {
  constructor(private readonly overstay: OverstayService) {}

  @Post('sweep')
  sweep() {
    return this.overstay.runEndOfDaySweep();
  }
}
