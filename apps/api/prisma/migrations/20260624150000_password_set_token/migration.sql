-- One-time set-password token for invites / resets.
ALTER TABLE "users" ADD COLUMN "password_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "password_token_expires_at" TIMESTAMP(3);
