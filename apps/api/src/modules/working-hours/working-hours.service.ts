import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { BlackoutDate, WorkingHour } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import type { UpsertWorkingHourDto } from './dto/upsert-working-hour.dto';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- working_hours (PRD §3) ----------------------------------------------

  listWorkingHours(): Promise<WorkingHour[]> {
    return this.prisma.workingHour.findMany({ orderBy: { dayOfWeek: 'asc' } });
  }

  async upsertWorkingHour(
    dayOfWeek: number,
    dto: UpsertWorkingHourDto,
    actorId: string,
  ): Promise<WorkingHour> {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek must be an integer 0–6 (Sunday–Saturday).');
    }

    const data = {
      openTime: dto.openTime,
      closeTime: dto.closeTime,
      isActive: dto.isActive,
      updatedById: actorId,
    };
    const rule = await this.prisma.workingHour.upsert({
      where: { dayOfWeek },
      update: data,
      create: { dayOfWeek, ...data },
    });

    await this.audit.log({
      actorId,
      action: 'working_hours.updated',
      targetType: 'working_hour',
      targetId: rule.id,
      meta: {
        dayOfWeek,
        openTime: rule.openTime,
        closeTime: rule.closeTime,
        isActive: rule.isActive,
      },
    });
    return rule;
  }

  // --- blackout_dates (PRD §3) ---------------------------------------------

  listBlackoutDates(): Promise<BlackoutDate[]> {
    return this.prisma.blackoutDate.findMany({ orderBy: { date: 'asc' } });
  }

  async addBlackoutDate(dto: CreateBlackoutDateDto, actorId: string): Promise<BlackoutDate> {
    const blackout = await this.prisma.blackoutDate.create({
      data: {
        date: new Date(`${dto.date}T00:00:00.000Z`),
        reason: dto.reason.trim(),
        createdById: actorId,
      },
    });
    await this.audit.log({
      actorId,
      action: 'blackout_date.created',
      targetType: 'blackout_date',
      targetId: blackout.id,
      meta: { date: dto.date, reason: blackout.reason },
    });
    return blackout;
  }

  async removeBlackoutDate(id: string, actorId: string): Promise<void> {
    const existing = await this.prisma.blackoutDate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Blackout date not found.');

    await this.prisma.blackoutDate.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'blackout_date.deleted',
      targetType: 'blackout_date',
      targetId: id,
      meta: { date: existing.date.toISOString().slice(0, 10) },
    });
  }

  // --- shared gate (PRD §4.8) ----------------------------------------------

  /**
   * Whether the facility is open at `at`: not a blackout date, and within the
   * day's active hours. Reused by the check-in flow (VisitsService).
   */
  async isOpenAt(at: Date): Promise<boolean> {
    const dateOnly = new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()));
    const blackout = await this.prisma.blackoutDate.findFirst({ where: { date: dateOnly } });
    if (blackout) return false;

    const rule = await this.prisma.workingHour.findUnique({ where: { dayOfWeek: at.getDay() } });
    if (!rule || !rule.isActive) return false;

    const minutesNow = at.getHours() * 60 + at.getMinutes();
    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };
    return minutesNow >= toMinutes(rule.openTime) && minutesNow < toMinutes(rule.closeTime);
  }
}
