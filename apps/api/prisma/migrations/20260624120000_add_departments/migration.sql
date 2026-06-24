-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- Backfill the pick-list from existing free-text user departments (one-time, idempotent).
INSERT INTO "departments" ("id", "name", "created_at")
SELECT gen_random_uuid()::text, s.d, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "department" AS d
    FROM "users"
    WHERE "department" IS NOT NULL AND "department" <> ''
) s
ON CONFLICT ("name") DO NOTHING;
