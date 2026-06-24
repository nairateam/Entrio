-- Host reply to the front desk (PRD §4.5 follow-up).
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'host_response';

-- Optional free-text body for notifications that carry a message.
ALTER TABLE "notifications" ADD COLUMN "message" TEXT;
