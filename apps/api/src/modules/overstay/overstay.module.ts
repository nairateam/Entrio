import { Module } from '@nestjs/common';
import { PushModule } from '../../integrations/web-push/push.module';
import { SettingsModule } from '../settings/settings.module';
import { OverstayController } from './overstay.controller';
import { OverstayService } from './overstay.service';

/** Overstay alerts + end-of-day auto-checkout sweeps (PRD §4.6). */
@Module({
  imports: [SettingsModule, PushModule],
  controllers: [OverstayController],
  providers: [OverstayService],
})
export class OverstayModule {}
