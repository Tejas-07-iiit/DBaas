-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('PROVISION', 'START', 'STOP', 'RESTART', 'DELETE');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "database_operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "OperationType" NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "provider_op_id" TEXT,
    "error_details" TEXT,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "database_id" UUID NOT NULL,

    CONSTRAINT "database_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "database_operations_database_id_idx" ON "database_operations"("database_id");

-- CreateIndex
CREATE INDEX "database_operations_status_idx" ON "database_operations"("status");

-- CreateIndex
CREATE INDEX "database_operations_type_idx" ON "database_operations"("type");

-- CreateIndex
CREATE INDEX "database_operations_created_at_idx" ON "database_operations"("created_at");

-- AddForeignKey
ALTER TABLE "database_operations" ADD CONSTRAINT "database_operations_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "database_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
