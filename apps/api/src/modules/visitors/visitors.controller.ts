import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { FlagVisitorDto } from './dto/flag-visitor.dto';
import { VisitorsService } from './visitors.service';

type AuthUser = { id: string; role: UserRole };

// Front-desk + management roles operate on visitors; hosts pre-register elsewhere.
const FRONT_DESK = [UserRole.SECURITY, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('visitors')
@Controller('visitors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitorsController {
  constructor(private readonly visitors: VisitorsService) {}

  @Get('search')
  @Roles(...FRONT_DESK)
  search(@Query('q') q = '') {
    return this.visitors.search(q);
  }

  @Post()
  @Roles(...FRONT_DESK, UserRole.HOST)
  create(@Body() dto: CreateVisitorDto, @CurrentUser() user: AuthUser) {
    return this.visitors.create(dto, user.id);
  }

  @Get(':id')
  @Roles(...FRONT_DESK)
  findOne(@Param('id') id: string) {
    return this.visitors.findById(id);
  }

  @Get(':id/security-check')
  @Roles(...FRONT_DESK)
  securityCheck(@Param('id') id: string, @Query('hostId') hostId: string) {
    return this.visitors.securityCheck(id, hostId);
  }

  @Post(':id/flag')
  @Roles(...FRONT_DESK)
  flag(@Param('id') id: string, @Body() dto: FlagVisitorDto, @CurrentUser() user: AuthUser) {
    return this.visitors.flag(id, dto.note, user.id);
  }
}
