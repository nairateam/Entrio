import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, VisitStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VisitsService } from '../visits/visits.service';
import { VisitorsService } from '../visitors/visitors.service';
import type { SelfCheckInDto } from './dto/self-check-in.dto';

/**
 * The consent policy shown at the device (PRD v2 §3 Step 7 / §5.3). Bump the
 * version whenever the text changes — the agreed version is stored per visit.
 */
export const CONSENT_POLICY = {
  version: '2026-06-v1',
  text:
    'By checking in you agree to follow all site safety and security policies, ' +
    'to be escorted where required, and to the recording of your visit (including ' +
    'a photograph) for security purposes. Your details are processed only to manage ' +
    'your visit and are retained per our data-retention policy.',
};

/** Kiosk-safe visitor match — deliberately omits block/flag status. */
export interface KioskVisitorMatch {
  visitorId: string;
  fullName: string;
  phoneLast4: string;
  photoUrl: string | null;
  expectedVisitId: string | null;
  hostName: string | null;
}

/** A currently-checked-in visit, for the streamlined check-out list (PRD v2 §3.3). */
export interface KioskActiveVisit {
  visitId: string;
  visitorName: string;
  phoneLast4: string;
  photoUrl: string | null;
  hostName: string;
  checkInTime: string | null;
}

export type SelfCheckInResult =
  | { status: 'success'; visitorName: string; hostName: string; entryCode: string }
  | { status: 'redirect' };

@Injectable()
export class SelfServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visits: VisitsService,
    private readonly visitors: VisitorsService,
  ) {}

  consentPolicy() {
    return CONSENT_POLICY;
  }

  /**
   * Active hosts a walk-in can choose from (PRD v2 §3 Step 4). With no query this
   * returns the full directory (the kiosk fetches it once and filters client-side).
   */
  async searchHosts(query: string): Promise<Array<{ id: string; fullName: string; department: string | null }>> {
    const q = query?.trim();
    const hosts = await this.prisma.user.findMany({
      where: {
        role: UserRole.host,
        isActive: true,
        ...(q ? { fullName: { contains: q, mode: 'insensitive' as const } } : {}),
      },
      select: { id: true, fullName: true, department: true },
      orderBy: { fullName: 'asc' },
      take: 1000,
    });
    return hosts;
  }

  /** Disambiguation search (PRD v2 §3 Step 2b) — never leaks block/flag state. */
  async search(query: string): Promise<KioskVisitorMatch[]> {
    const results = await this.visitors.search(query ?? '');
    return results.map((r) => ({
      visitorId: r.visitor.id,
      fullName: r.visitor.fullName,
      phoneLast4: r.visitor.phone.slice(-4),
      photoUrl: r.visitor.photoUrl,
      expectedVisitId: r.expectedVisit?.id ?? null,
      hostName: r.expectedVisit?.hostName ?? null,
    }));
  }

  /**
   * Everyone currently checked in (PRD v2 §3.3 — streamlined check-out). With no
   * query this returns the full "inside now" list; the kiosk fetches it once and
   * filters client-side, tapping a row to check out.
   */
  async listActive(query: string): Promise<KioskActiveVisit[]> {
    const q = query?.trim();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const visits = await this.prisma.visit.findMany({
      where: {
        status: VisitStatus.checked_in,
        // Only today's arrivals — prior-day stragglers are an overstay/auto-close concern.
        checkInTime: { gte: startOfToday },
        ...(q
          ? {
              OR: [
                { visitor: { fullName: { contains: q, mode: 'insensitive' as const } } },
                { visitor: { phone: { contains: q } } },
                { visitorName: { contains: q, mode: 'insensitive' as const } },
                { visitorPhone: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        visitor: { select: { fullName: true, phone: true, photoUrl: true } },
        host: { select: { fullName: true } },
      },
      orderBy: { checkInTime: 'desc' },
      take: 1000,
    });
    return visits.map((v) => ({
      visitId: v.id,
      visitorName: v.visitor?.fullName ?? v.visitorName ?? 'Visitor',
      phoneLast4: (v.visitor?.phone ?? v.visitorPhone ?? '').slice(-4),
      photoUrl: v.visitor?.photoUrl ?? v.photoUrl,
      hostName: v.host.fullName,
      checkInTime: v.checkInTime?.toISOString() ?? null,
    }));
  }

  /**
   * Self-service check-in (PRD v2 §3.2). Resolves the visitor + host, runs the
   * silent gates, and either completes the visit or records a staff exception —
   * returning a neutral redirect either way so the device never reveals why.
   */
  async checkIn(dto: SelfCheckInDto, deviceId: string): Promise<SelfCheckInResult> {
    if (!dto.consentAccepted) throw new BadRequestException('Consent is required to check in.');

    // --- Pre-registered: fulfill the host-created expected visit (keeps its Visitor) ---
    if (dto.expectedVisitId) {
      const expected = await this.prisma.visit.findUnique({ where: { id: dto.expectedVisitId } });
      if (!expected || expected.status !== VisitStatus.expected) {
        throw new NotFoundException('That pre-registered visit is no longer available.');
      }
      const purpose = dto.purpose ?? expected.purpose;
      const gate = expected.visitorId
        ? await this.visits.evaluateEntryGates(expected.visitorId, expected.hostId)
        : await this.visits.evaluateWorkingHours();
      if (!gate.ok) {
        await this.visits.recordSelfServiceException({
          visitorId: expected.visitorId,
          hostId: expected.hostId,
          purpose,
          reason: gate.reason!,
          deviceId,
        });
        return { status: 'redirect' };
      }
      const { visit, entryCode } = await this.visits.selfServiceCheckIn({
        expectedVisitId: expected.id,
        visitorId: expected.visitorId,
        hostId: expected.hostId,
        purpose,
        headshot: dto.headshot,
        signature: dto.signature,
        consentVersion: dto.consentVersion,
        deviceId,
      });
      return { status: 'success', visitorName: visit.visitorName, hostName: visit.hostName, entryCode };
    }

    // --- Walk-in: a self-contained log entry, NO Visitor record (PRD v2) ---
    if (!dto.newVisitor) throw new BadRequestException('Visitor details are required.');
    if (!dto.hostId) throw new BadRequestException('A host is required for a walk-in check-in.');

    // No persistent identity to check against the blocklist/restriction list, so
    // only the working-hours gate applies (blocklist/flag deferred — PRD v2).
    const gate = await this.visits.evaluateWorkingHours();
    if (!gate.ok) {
      await this.visits.recordSelfServiceException({
        hostId: dto.hostId,
        purpose: dto.purpose,
        visitorName: dto.newVisitor.fullName,
        visitorPhone: dto.newVisitor.phone,
        reason: gate.reason!,
        deviceId,
      });
      return { status: 'redirect' };
    }

    const { visit, entryCode } = await this.visits.selfServiceCheckIn({
      hostId: dto.hostId,
      purpose: dto.purpose,
      visitorName: dto.newVisitor.fullName,
      visitorPhone: dto.newVisitor.phone,
      visitorEmail: dto.newVisitor.email,
      headshot: dto.headshot,
      signature: dto.signature,
      consentVersion: dto.consentVersion,
      deviceId,
    });
    return { status: 'success', visitorName: visit.visitorName, hostName: visit.hostName, entryCode };
  }
}
