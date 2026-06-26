-- PRD v2: self-service check-in.

-- New notification type for self-service exceptions (blocked / restricted / after-hours).
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'self_service_exception';

-- Visits: re-add the typed entry code (repurposed badge_code) + consent capture.
ALTER TABLE "visits" ADD COLUMN "entry_code" TEXT;
ALTER TABLE "visits" ADD COLUMN "consent_accepted_at" TIMESTAMP(3);
ALTER TABLE "visits" ADD COLUMN "consent_version" TEXT;
CREATE UNIQUE INDEX "visits_entry_code_key" ON "visits"("entry_code");

-- Devices: scoped self-service credentials managed by Admin.
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "api_token_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);
