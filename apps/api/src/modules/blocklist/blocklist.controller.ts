import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parsePageArgs } from '../../common/pagination';
import { BlocklistService } from './blocklist.service';
import { BlockVisitorDto } from './dto/block-visitor.dto';

type AuthUser = { id: string; role: UserRole };

// View/manage blocklist + flagged is Admin only (PRD §2.1).
// Security can raise a flag (POST /visitors/:id/flag) but cannot block.
@ApiTags('blocklist')
@Controller('blocklist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BlocklistController {
  constructor(private readonly blocklist: BlocklistService) {}

  @Get()
  listBlocked(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.blocklist.listBlocked(parsePageArgs(page, pageSize), search);
  }

  @Get('flagged')
  listFlagged(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.blocklist.listFlagged(parsePageArgs(page, pageSize), search);
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
