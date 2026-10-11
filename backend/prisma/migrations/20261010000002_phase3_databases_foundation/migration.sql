-- AlterTable
ALTER TABLE "database_instances" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "internal_network" TEXT,
ALTER COLUMN "status" SET DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE "database_events" ADD COLUMN     "new_status" "DatabaseStatus",
ADD COLUMN     "previous_status" "DatabaseStatus";

-- CreateIndex
CREATE INDEX "database_instances_type_idx" ON "database_instances"("type");

-- CreateIndex
CREATE INDEX "database_instances_project_id_status_idx" ON "database_instances"("project_id", "status");
