import {
  NotificationChannel,
  NotificationType,
  PrismaClient,
  UserRole,
  VisitStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Seeds demo data:
 *  - staff accounts mirroring the web mock login (password: "password")
 *  - working hours (Mon–Fri open)
 *  - a normal visitor + a blocked visitor (to exercise the check-in gates)
 *  - one checked-in visit so the live board isn't empty
 */
const DEMO_USERS = [
  { email: 'admin@entrio.dev', fullName: 'Ada Lovelace', role: UserRole.admin, department: 'Operations' },
  { email: 'security@entrio.dev', fullName: 'Sam Okonkwo', role: UserRole.security, department: 'Front Desk' },
  { email: 'host@entrio.dev', fullName: 'Sarah Chen', role: UserRole.host, department: 'Engineering' },
];

const WORKING_HOURS = [
  { dayOfWeek: 0, openTime: '09:00', closeTime: '17:00', isActive: false },
  { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isActive: false },
];

async function main() {
  const passwordHash = await argon2.hash('password');

  const usersByEmail = new Map<string, string>();
  for (const user of DEMO_USERS) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { fullName: user.fullName, role: user.role, department: user.department },
      create: { ...user, passwordHash },
    });
    usersByEmail.set(user.email, saved.id);
  }
  const adminId = usersByEmail.get('admin@entrio.dev')!;
  const hostId = usersByEmail.get('host@entrio.dev')!;

  for (const wh of WORKING_HOURS) {
    await prisma.workingHour.upsert({
      where: { dayOfWeek: wh.dayOfWeek },
      update: { openTime: wh.openTime, closeTime: wh.closeTime, isActive: wh.isActive, updatedById: adminId },
      create: { ...wh, updatedById: adminId },
    });
  }

  const maria = await prisma.visitor.upsert({
    where: { fullName_phone: { fullName: 'Maria Garcia', phone: '+1 555 0123' } },
    update: {},
    create: { fullName: 'Maria Garcia', phone: '+1 555 0123', email: 'maria.garcia@example.com' },
  });

  await prisma.visitor.upsert({
    where: { fullName_phone: { fullName: 'Dmitri Volkov', phone: '+1 555 0666' } },
    update: { isBlocked: true, blockReason: 'Prior security incident.', blockedById: adminId, blockedAt: new Date() },
    create: {
      fullName: 'Dmitri Volkov',
      phone: '+1 555 0666',
      isBlocked: true,
      blockReason: 'Prior security incident.',
      blockedById: adminId,
      blockedAt: new Date(),
    },
  });

  // One checked-in visit so the board has data on a fresh DB.
  let sampleVisit = await prisma.visit.findFirst({ where: { status: VisitStatus.checked_in } });
  if (!sampleVisit) {
    sampleVisit = await prisma.visit.create({
      data: {
        visitorId: maria.id,
        hostId,
        purpose: 'Interview',
        status: VisitStatus.checked_in,
        checkInTime: new Date(),
        checkedInById: usersByEmail.get('security@entrio.dev')!,
      },
    });
  }

  // Demo inbox items across types/recipients.
  if ((await prisma.notification.count()) === 0) {
    await prisma.notification.createMany({
      data: [
        {
          visitId: sampleVisit.id,
          recipientId: hostId,
          type: NotificationType.arrival_alert,
          channel: NotificationChannel.in_app,
        },
        {
          visitId: sampleVisit.id,
          recipientId: adminId,
          type: NotificationType.override_request,
          channel: NotificationChannel.in_app,
        },
        {
          visitId: sampleVisit.id,
          recipientId: adminId,
          type: NotificationType.overstay_alert,
          channel: NotificationChannel.in_app,
        },
      ],
    });
  }

  console.log('Seed complete: users, working hours, visitors, a sample visit, and notifications.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
