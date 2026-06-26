-- Overstay handling: distinguish an end-of-day auto-close from a real check-out.
ALTER TABLE "visits" ADD COLUMN "auto_checked_out" BOOLEAN NOT NULL DEFAULT false;
