-- PRD v1.1: remove the QR badge from visits.
ALTER TABLE "visits" DROP COLUMN "badge_code";

-- PRD v1.1: reduce UserRole to security / host / admin (no rows use the removed values).
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('security', 'host', 'admin');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
DROP TYPE "UserRole_old";
