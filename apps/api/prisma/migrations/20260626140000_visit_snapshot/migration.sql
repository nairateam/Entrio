-- PRD v2: self-service walk-ins are self-contained log entries (no Visitor record).
-- Make the visitor link optional and denormalize the captured details onto the visit.

ALTER TABLE "visits" ALTER COLUMN "visitor_id" DROP NOT NULL;

ALTER TABLE "visits" ADD COLUMN "visitor_name"  TEXT;
ALTER TABLE "visits" ADD COLUMN "visitor_phone" TEXT;
ALTER TABLE "visits" ADD COLUMN "visitor_email" TEXT;
ALTER TABLE "visits" ADD COLUMN "photo_url"     TEXT;
ALTER TABLE "visits" ADD COLUMN "signature_url" TEXT;
