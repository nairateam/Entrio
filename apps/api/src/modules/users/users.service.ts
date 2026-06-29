import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole, type User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../../integrations/email/email.service';
import { inviteEmail } from '../../integrations/email/email.templates';
import { toPrismaRole } from '../../common/mappers/role.mapper';
import { paginated, type PageArgs, type Paginated } from '../../common/pagination';
import type { InviteUserDto } from './dto/invite-user.dto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.security]: 'Security officer',
  [UserRole.host]: 'Host',
  [UserRole.admin]: 'Administrator',
};

/** sha256 of a raw token — deterministic so we can look it up, fine for high-entropy tokens. */
const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');

/** Columns safe to return over the API — everything except passwordHash. */
export const userPublicSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  department: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: userPublicSelect });
  }

  /** Paginated user directory with optional search + role filter (admin management). */
  async list(
    args: PageArgs,
    opts: { search?: string; role?: string } = {},
  ): Promise<Paginated<PublicUser>> {
    const q = opts.search?.trim();
    const roleFilter =
      opts.role && (Object.values(UserRole) as string[]).includes(opts.role)
        ? (opts.role as UserRole)
        : undefined;

    const where: Prisma.UserWhereInput = {
      AND: [
        ...(roleFilter ? [{ role: roleFilter }] : []),
        ...(q
          ? [
              {
                OR: [
                  { fullName: { contains: q, mode: 'insensitive' as const } },
                  { email: { contains: q, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userPublicSelect,
        orderBy: { createdAt: 'asc' },
        skip: args.skip,
        take: args.take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(rows, total, args);
  }

  /** Activate / deactivate (soft access control — never hard-delete). */
  async setActive(id: string, isActive: boolean, actorId: string): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found.');

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: userPublicSelect,
    });
    await this.audit.log({
      actorId,
      action: isActive ? 'user.activated' : 'user.deactivated',
      targetType: 'user',
      targetId: id,
    });
    return user;
  }

  /**
   * Invite a user: create the (active) account with an unusable random password
   * and a one-time set-password token, then email them a link to set it. If email
   * isn't configured, the link is logged so the flow is still testable.
   */
  async invite(dto: InviteUserDto, actorId: string): Promise<PublicUser> {
    return this.inviteOne(dto, actorId);
  }

  /**
   * Invite a batch of users in one request (admin CSV upload). Each row is
   * processed independently: a duplicate or invalid row is reported in `failed`
   * without aborting the rest. Returns a per-row summary.
   */
  async bulkInvite(
    rows: InviteUserDto[],
    actorId: string,
  ): Promise<{
    created: PublicUser[];
    failed: Array<{ index: number; email: string; reason: string }>;
    total: number;
  }> {
    const created: PublicUser[] = [];
    const failed: Array<{ index: number; email: string; reason: string }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i += 1) {
      const dto = rows[i];
      const email = dto.email.trim().toLowerCase();
      // Catch duplicates within the same file before hitting the DB.
      if (seen.has(email)) {
        failed.push({ index: i, email, reason: 'Duplicate email in this file.' });
        continue;
      }
      seen.add(email);
      try {
        created.push(await this.inviteOne(dto, actorId));
      } catch (err) {
        const reason =
          err instanceof ConflictException
            ? 'A user with that email already exists.'
            : 'Could not invite.';
        failed.push({ index: i, email, reason });
      }
    }

    await this.audit.log({
      actorId,
      action: 'user.bulk_invited',
      targetType: 'user',
      targetId: 'bulk',
      meta: { total: rows.length, created: created.length, failed: failed.length },
    });
    return { created, failed, total: rows.length };
  }

  /** Create one invited (active-pending) account + email the set-password link. */
  private async inviteOne(dto: InviteUserDto, actorId: string): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with that email already exists.');
    }

    const department = dto.department?.trim() || null;
    // Keep the managed pick-list canonical: a department typed into the invite
    // combobox that isn't on the list yet is added to it.
    if (department) {
      await this.prisma.department.upsert({
        where: { name: department },
        update: {},
        create: { name: department },
      });
    }

    // Unusable password until they set one via the emailed link.
    const passwordHash = await argon2.hash(randomBytes(24).toString('hex'));
    const rawToken = randomBytes(32).toString('base64url');
    const role = toPrismaRole(dto.role);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        role,
        department,
        passwordHash,
        passwordTokenHash: hashToken(rawToken),
        passwordTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
      select: userPublicSelect,
    });

    await this.sendInvite(user.fullName, email, role, rawToken);

    await this.audit.log({
      actorId,
      action: 'user.invited',
      targetType: 'user',
      targetId: user.id,
      meta: { email, role: dto.role },
    });
    return user;
  }

  private async sendInvite(name: string, email: string, role: UserRole, rawToken: string) {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const url = `${appUrl}/set-password?token=${rawToken}`;
    const { subject, html } = inviteEmail({ name, roleLabel: ROLE_LABELS[role], url });

    const sent = await this.email.send({ to: email, subject, html });
    if (!sent) {
      // Email disabled or failed — surface the link so an admin can still deliver it.
      this.logger.warn(`Invite email not sent to ${email}. Set-password link: ${url}`);
    }
  }

  /** Look up the full user record by a (hashed) set-password token. */
  findByPasswordToken(rawToken: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { passwordTokenHash: hashToken(rawToken) } });
  }

  /** Set a new password and consume the token (activates an invited user). */
  async completePasswordSet(id: string, passwordHash: string): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        isActive: true,
        passwordTokenHash: null,
        passwordTokenExpiresAt: null,
      },
      select: userPublicSelect,
    });
  }

  findPublicByEmail(email: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({ where: { email }, select: userPublicSelect });
  }

  /** Full record incl. passwordHash — for the auth flow only, never returned to clients. */
  findByEmailWithSecret(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
