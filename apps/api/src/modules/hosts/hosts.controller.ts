import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddRestrictionDto } from './dto/add-restriction.dto';
import { PreRegisterDto } from './dto/pre-register.dto';
import { HostsService } from './hosts.service';

type AuthUser = { id: string; role: UserRole };

// Host-scoped ("me" = the authenticated host). Pre-register + restrict are host
// actions per PRD §2.1/§4.4/§4.11.
@ApiTags('hosts')
@Controller('hosts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOST)
export class HostsController {
  constructor(private readonly hosts: HostsService) {}

  @Get('me/visits')
  myVisits(@CurrentUser() user: AuthUser) {
    return this.hosts.listMyVisits(user.id);
  }

  @Post('me/visits')
  preRegister(@Body() dto: PreRegisterDto, @CurrentUser() user: AuthUser) {
    return this.hosts.preRegister(user.id, dto);
  }

  @Post('me/visits/:id/on-my-way')
  @HttpCode(200)
  onMyWay(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.hosts.markOnMyWay(id, user.id);
  }

  @Get('me/restrictions')
  myRestrictions(@CurrentUser() user: AuthUser) {
    return this.hosts.listRestrictions(user.id);
  }

  @Post('me/restrictions')
  addRestriction(@Body() dto: AddRestrictionDto, @CurrentUser() user: AuthUser) {
    return this.hosts.addRestriction(user.id, dto);
  }

  @Delete('me/restrictions/:id')
  @HttpCode(204)
  async liftRestriction(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.hosts.liftRestriction(id, user.id);
  }
}
