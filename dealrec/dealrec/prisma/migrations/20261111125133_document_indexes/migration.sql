-- DropIndex
DROP INDEX "DealDocument_dealId_versionNumber_documentType_key";

-- CreateIndex
CREATE INDEX "DealDocument_dealId_versionNumber_documentType_idx" ON "DealDocument"("dealId", "versionNumber", "documentType");
