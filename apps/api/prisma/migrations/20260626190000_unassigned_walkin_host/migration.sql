-- Walk-ins check in before staff assign the host (PRD v2). Host link becomes
-- optional; the visitor's typed host is kept on the visit until assigned.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'host_assignment';

ALTER TABLE "visits" ALTER COLUMN "host_id" DROP NOT NULL;
ALTER TABLE "visits" ADD COLUMN "requested_host_name" TEXT;
