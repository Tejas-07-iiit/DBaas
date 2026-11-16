-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('REQUESTED', 'PROVISIONING', 'RUNNING', 'STOPPING', 'STOPPED', 'RESTARTING', 'FAILED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'REQUESTED',
ADD COLUMN "vm_id" TEXT,
ADD COLUMN "internal_ip" TEXT,
ADD COLUMN "cpu_cores" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "ram_mb" INTEGER NOT NULL DEFAULT 4096,
ADD COLUMN "storage_mb" INTEGER NOT NULL DEFAULT 20480,
ADD COLUMN "failure_reason" TEXT;

-- CreateTable
CREATE TABLE "project_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_token_key" ON "project_invitations"("token");

-- CreateIndex
CREATE INDEX "project_invitations_token_idx" ON "project_invitations"("token");

-- CreateIndex
CREATE INDEX "project_invitations_email_idx" ON "project_invitations"("email");

-- CreateIndex
CREATE INDEX "project_invitations_project_id_idx" ON "project_invitations"("project_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- AddForeignKey
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
