import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VisitStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { visitorDisplayName } from '../../common/visit-name';
import { normalizeEntryCode } from '../../common/entry-code';
import { VisitsService } from '../visits/visits.service';
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

/** A currently-checked-in visit, for the streamlined check-out list (PRD v2 §3.3). */
export interface EntryActiveVisit {
  visitorName: string;
  phoneLast4: string;
  hostName: string;
  checkInTime: string | null;
}

export type SelfCheckInResult =
  | { status: 'success'; visitorName: string; hostName: string | null; entryCode: string }
  | { status: 'redirect' };

@Injectable()
export class SelfServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visits: VisitsService,
  ) {}

  consentPolicy() {
    return CONSENT_POLICY;
  }

  /**
   * Everyone currently checked in (PRD v2 §3.3 — streamlined check-out). With no
   * query this returns the full "inside now" list; the kiosk fetches it once and
   * filters client-side, tapping a row to check out.
   */
  async listActive(query: string): Promise<EntryActiveVisit[]> {
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
        visitor: { select: { fullName: true, phone: true } },
        host: { select: { fullName: true } },
      },
      orderBy: { checkInTime: 'desc' },
      take: 1000,
    });
    // Roster is for confirming you're checked in; it deliberately omits photos and
    // the visit id (check-out is keyed on the visitor's own entry code, not an id).
    return visits.map((v) => ({
      visitorName: visitorDisplayName(v),
      phoneLast4: (v.visitor?.phone ?? v.visitorPhone ?? '').slice(-4),
      hostName: v.host?.fullName ?? '—',
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

    // --- Pre-registered: resolve the expected visit from the typed code (server-side).
    // Clients never pass a visit id, so a returned/guessed id can't drive a check-in. ---
    if (dto.entryCode) {
      const expected = await this.prisma.visit.findUnique({
        where: { entryCode: normalizeEntryCode(dto.entryCode) },
      });
      if (!expected || expected.status !== VisitStatus.expected) {
        throw new NotFoundException('That pre-registered visit is no longer available.');
      }
      const purpose = dto.purpose ?? expected.purpose;
      const gate =
        expected.visitorId && expected.hostId
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

    // --- Walk-in: a self-contained log entry, NO Visitor record, NO host yet.
    // The visitor checks in immediately; front desk assigns the host and nudges
    // them. No host directory is exposed to the visitor (PRD v2). ---
    if (!dto.newVisitor) throw new BadRequestException('Visitor details are required.');

    // No persistent identity to check against the blocklist/restriction list, so
    // only the working-hours gate applies (blocklist/flag deferred — PRD v2).
    const gate = await this.visits.evaluateWorkingHours();
    if (!gate.ok) {
      await this.visits.recordSelfServiceException({
        purpose: dto.purpose,
        visitorName: dto.newVisitor.fullName,
        visitorPhone: dto.newVisitor.phone,
        requestedHostName: dto.requestedHost,
        reason: gate.reason!,
        deviceId,
      });
      return { status: 'redirect' };
    }

    const { visit, entryCode } = await this.visits.selfServiceCheckIn({
      purpose: dto.purpose,
      visitorName: dto.newVisitor.fullName,
      visitorPhone: dto.newVisitor.phone,
      visitorEmail: dto.newVisitor.email,
      requestedHostName: dto.requestedHost,
      headshot: dto.headshot,
      signature: dto.signature,
      consentVersion: dto.consentVersion,
      deviceId,
    });
    return {
      status: 'success',
      visitorName: visit.visitorName,
      hostName: visit.hostName ?? null,
      entryCode,
    };
  }

  /**
   * Self check-out (PRD v2 §3.3). Resolves the caller's own active visit from the
   * typed entry code — a raw visit id is never accepted, so a visitor can only
   * check out the visit whose code they hold (not an arbitrary one).
   */
  async checkOut(entryCode: string, deviceId: string) {
    const code = normalizeEntryCode(entryCode);
    const visit = await this.prisma.visit.findUnique({
      where: { entryCode: code },
      select: { id: true, status: true },
    });
    if (!visit || visit.status !== VisitStatus.checked_in) {
      throw new NotFoundException('No active visit found for that code.');
    }
    return this.visits.selfServiceCheckOut(visit.id, deviceId);
  }
}
