import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceAuthGuard } from './guards/device-auth.guard';

/** Self-service device credentials + the guard that authenticates them (PRD v2 §2.1). */
@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DeviceAuthGuard],
  exports: [DevicesService, DeviceAuthGuard],
})
export class DevicesModule {}
