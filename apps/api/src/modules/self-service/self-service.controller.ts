import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Device } from '@prisma/client';
import { CurrentDevice } from '../devices/decorators/current-device.decorator';
import { DeviceAuthGuard } from '../devices/guards/device-auth.guard';
import { VisitsService } from '../visits/visits.service';
import { SelfCheckInDto } from './dto/self-check-in.dto';
import { SelfCheckOutDto } from './dto/self-check-out.dto';
import { SelfServiceService } from './self-service.service';

/**
 * Visitor-facing self-service endpoints (PRD v2 §3). Authenticated ONLY by the
 * shared-device token — never by a human JWT — and scoped to check-in/out so a
 * lost device can reach nothing else.
 */
@ApiTags('self-service')
@Controller('self-service')
@UseGuards(DeviceAuthGuard)
export class SelfServiceController {
  constructor(
    private readonly selfService: SelfServiceService,
    private readonly visits: VisitsService,
  ) {}

  @Get('consent')
  consent() {
    return this.selfService.consentPolicy();
  }

  // --- check-in --------------------------------------------------------------

  @Get('visitors/search')
  search(@Query('q') q?: string) {
    return this.selfService.search(q ?? '');
  }

  @Get('hosts/search')
  searchHosts(@Query('q') q?: string) {
    return this.selfService.searchHosts(q ?? '');
  }

  @Get('visits/by-code/:code')
  byCode(@Param('code') code: string) {
    return this.visits.findExpectedByCode(code);
  }

  @Post('check-in')
  checkIn(@Body() dto: SelfCheckInDto, @CurrentDevice() device: Device) {
    return this.selfService.checkIn(dto, device.id);
  }

  // --- check-out -------------------------------------------------------------

  @Get('checkout/active')
  listActive(@Query('q') q?: string) {
    return this.selfService.listActive(q ?? '');
  }

  @Get('checkout/by-code/:code')
  activeByCode(@Param('code') code: string) {
    return this.visits.findActiveByCode(code);
  }

  @Post('check-out')
  checkOut(@Body() dto: SelfCheckOutDto, @CurrentDevice() device: Device) {
    return this.visits.selfServiceCheckOut(dto.visitId, device.id);
  }
}
