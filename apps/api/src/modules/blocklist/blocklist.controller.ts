import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlocklistService } from './blocklist.service';
import { BlockVisitorDto } from './dto/block-visitor.dto';

type AuthUser = { id: string; role: UserRole };

// View/manage blocklist + flagged is Supervisor / Admin / Super Admin (PRD §2.1).
// Security can raise a flag (POST /visitors/:id/flag) but cannot block.
@ApiTags('blocklist')
@Controller('blocklist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class BlocklistController {
  constructor(private readonly blocklist: BlocklistService) {}

  @Get()
  listBlocked() {
    return this.blocklist.listBlocked();
  }

  @Get('flagged')
  listFlagged() {
    return this.blocklist.listFlagged();
  }

  @Post(':visitorId/block')
  @HttpCode(200)
  block(
    @Param('visitorId') visitorId: string,
    @Body() dto: BlockVisitorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.blocklist.block(visitorId, dto.reason, user.id);
  }

  @Post(':visitorId/unblock')
  @HttpCode(200)
  unblock(@Param('visitorId') visitorId: string, @CurrentUser() user: AuthUser) {
    return this.blocklist.unblock(visitorId, user.id);
  }

  @Post(':visitorId/clear-flag')
  @HttpCode(200)
  clearFlag(@Param('visitorId') visitorId: string, @CurrentUser() user: AuthUser) {
    return this.blocklist.clearFlag(visitorId, user.id);
  }
}
