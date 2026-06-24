-- CreateEnum
CREATE TYPE "OverrideStatus" AS ENUM ('pending', 'approved', 'denied');

-- CreateTable
CREATE TABLE "override_requests" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "OverrideStatus" NOT NULL DEFAULT 'pending',
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "visit_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "override_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "override_requests_visit_id_key" ON "override_requests"("visit_id");

-- CreateIndex
CREATE INDEX "override_requests_status_idx" ON "override_requests"("status");

-- AddForeignKey
ALTER TABLE "override_requests" ADD CONSTRAINT "override_requests_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "override_requests" ADD CONSTRAINT "override_requests_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "override_requests" ADD CONSTRAINT "override_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "override_requests" ADD CONSTRAINT "override_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "override_requests" ADD CONSTRAINT "override_requests_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
