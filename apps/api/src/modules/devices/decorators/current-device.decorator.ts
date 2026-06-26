import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Device } from '@prisma/client';

/** Injects the device authenticated by DeviceAuthGuard (set on request.device). */
export const CurrentDevice = createParamDecorator((_data: unknown, ctx: ExecutionContext): Device => {
  return ctx.switchToHttp().getRequest().device;
});
