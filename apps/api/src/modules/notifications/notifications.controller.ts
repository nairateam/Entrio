import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PushService } from '../../integrations/web-push/push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscribePushDto, UnsubscribePushDto } from './dto/subscribe-push.dto';
import { NotificationsService } from './notifications.service';

type AuthUser = { id: string };

// Every authenticated user has their own inbox — no role restriction.
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.id);
  }

  @Post(':id/read')
  @HttpCode(204)
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.notifications.markRead(id, user.id);
  }

  @Post('read-all')
  @HttpCode(204)
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.notifications.markAllRead(user.id);
  }

  // --- Web Push subscription management ---

  @Get('push/public-key')
  publicKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('push/subscribe')
  @HttpCode(204)
  async subscribe(@Body() dto: SubscribePushDto, @CurrentUser() user: AuthUser) {
    await this.push.saveSubscription(user.id, dto);
  }

  @Post('push/unsubscribe')
  @HttpCode(204)
  async unsubscribe(@Body() dto: UnsubscribePushDto) {
    await this.push.removeSubscription(dto.endpoint);
  }
}
