-- Persist system settings (overstay threshold + notification toggles) so they
-- survive an API restart. Single row, id = 'system'.

CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "overstay_threshold_hours" INTEGER NOT NULL DEFAULT 4,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "system_settings" ("id") VALUES ('system') ON CONFLICT ("id") DO NOTHING;
