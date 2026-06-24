import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import { UpsertWorkingHourDto } from './dto/upsert-working-hour.dto';
import { WorkingHoursService } from './working-hours.service';

type AuthUser = { id: string; role: UserRole };

// Editing hours / blackout dates is Admin / Super Admin only (PRD §2.1).
@ApiTags('working-hours')
@Controller('working-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class WorkingHoursController {
  constructor(private readonly workingHours: WorkingHoursService) {}

  @Get()
  list() {
    return this.workingHours.listWorkingHours();
  }

  @Put(':dayOfWeek')
  upsert(
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Body() dto: UpsertWorkingHourDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workingHours.upsertWorkingHour(dayOfWeek, dto, user.id);
  }

  @Get('blackouts')
  listBlackouts() {
    return this.workingHours.listBlackoutDates();
  }

  @Post('blackouts')
  addBlackout(@Body() dto: CreateBlackoutDateDto, @CurrentUser() user: AuthUser) {
    return this.workingHours.addBlackoutDate(dto, user.id);
  }

  @Delete('blackouts/:id')
  @HttpCode(204)
  async removeBlackout(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.workingHours.removeBlackoutDate(id, user.id);
  }
}
