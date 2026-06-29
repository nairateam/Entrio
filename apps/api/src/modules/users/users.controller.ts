import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parsePageArgs } from '../../common/pagination';
import { InviteUserDto } from './dto/invite-user.dto';
import { BulkInviteDto } from './dto/bulk-invite.dto';
import { SetActiveDto } from './dto/set-active.dto';
import { UsersService } from './users.service';

type AuthUser = { id: string; role: UserRole };

// User management is Admin only (PRD v1.1 §2 — system-level configuration).
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.users.list(parsePageArgs(page, pageSize), { search, role });
  }

  @Post()
  invite(@Body() dto: InviteUserDto, @CurrentUser() user: AuthUser) {
    return this.users.invite(dto, user.id);
  }

  // Batch invite from a CSV upload — per-row results, never aborts on one bad row.
  @Post('bulk')
  bulkInvite(@Body() dto: BulkInviteDto, @CurrentUser() user: AuthUser) {
    return this.users.bulkInvite(dto.users, user.id);
  }

  @Patch(':id')
  setActive(
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.setActive(id, dto.isActive, user.id);
  }
}
