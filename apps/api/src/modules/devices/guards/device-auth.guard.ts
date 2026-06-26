import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DevicesService } from '../devices.service';

/** Header the self-service device sends its scoped token in. */
export const DEVICE_TOKEN_HEADER = 'x-device-token';

/**
 * Authenticates the shared self-service device (PRD v2 §2.1) by its token header.
 * This is a non-human principal: it grants access ONLY to the self-service
 * endpoints it guards — never to JWT/role-protected routes. On success the
 * resolved device is attached to `request.device`.
 */
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly devices: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers[DEVICE_TOKEN_HEADER];
    const token = Array.isArray(header) ? header[0] : header;

    const device = await this.devices.validateToken(token ?? '');
    if (!device) throw new UnauthorizedException('Invalid or revoked device token.');

    (request as Request & { device?: unknown }).device = device;
    return true;
  }
}
