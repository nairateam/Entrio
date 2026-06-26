import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@entrio/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DevicesService } from './devices.service';

type AuthUser = { id: string; role: UserRole };

// Device credential management is Admin only (PRD v2 §2.1).
@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  list() {
    return this.devices.list();
  }

  /** Creates a device and returns its token ONCE — surface it to Admin immediately. */
  @Post()
  create(@Body() dto: CreateDeviceDto, @CurrentUser() user: AuthUser) {
    return this.devices.create(dto.label, user.id);
  }

  @Delete(':id')
  revoke(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.devices.revoke(id, user.id);
  }
}
