-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "phoneNumber" TEXT,
    "phoneVerifiedAt" DATETIME,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purpose" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "reviewedAt" DATETIME,
    "definitionsJson" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dealType" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "totalAmount" INTEGER,
    "termsJson" TEXT NOT NULL DEFAULT '{}',
    "templateSlug" TEXT,
    "templateVersion" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "executedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "closedReason" TEXT,
    CONSTRAINT "Deal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL,
    "invitationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "authenticationLevel" TEXT NOT NULL DEFAULT 'NONE',
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "signatureRequired" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealParty_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" DATETIME,
    "changeSummary" TEXT,
    CONSTRAINT "DealDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DealDocument_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "signatureType" TEXT NOT NULL DEFAULT 'drawn',
    "signerName" TEXT NOT NULL,
    "authenticationMethod" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentTextVersion" TEXT NOT NULL,
    "signatureAssetKey" TEXT,
    "documentSha256" TEXT NOT NULL,
    CONSTRAINT "Signature_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DealDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signature_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "DealParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "actorPartyId" TEXT,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousEventHash" TEXT,
    "eventHash" TEXT NOT NULL,
    CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "authorPartyId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentDocumentId" TEXT,
    "correctionOfId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'COMMENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealComment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealComment_authorPartyId_fkey" FOREIGN KEY ("authorPartyId") REFERENCES "DealParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealComment_attachmentDocumentId_fkey" FOREIGN KEY ("attachmentDocumentId") REFERENCES "DealDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DealComment_correctionOfId_fkey" FOREIGN KEY ("correctionOfId") REFERENCES "DealComment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "recordedByPartyId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentDate" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "receiptDocumentId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentRecord_recordedByPartyId_fkey" FOREIGN KEY ("recordedByPartyId") REFERENCES "DealParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentRecord_receiptDocumentId_fkey" FOREIGN KEY ("receiptDocumentId") REFERENCES "DealDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "responsiblePartyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER,
    "kind" TEXT NOT NULL DEFAULT 'PAYMENT',
    "dueAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Obligation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Obligation_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "DealParty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "verifiedAt" DATETIME,
    "verifyMethod" TEXT,
    "lastOpenedAt" DATETIME,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "DealParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealSeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "revocationReason" TEXT,
    CONSTRAINT "DealSeal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealSeal_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DealDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "partyId" TEXT,
    "dealId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "DealParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Otp_purpose_target_idx" ON "Otp"("purpose", "target");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_reference_key" ON "Deal"("reference");

-- CreateIndex
CREATE INDEX "Deal_creatorId_idx" ON "Deal"("creatorId");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "DealParty_dealId_idx" ON "DealParty"("dealId");

-- CreateIndex
CREATE INDEX "DealParty_userId_idx" ON "DealParty"("userId");

-- CreateIndex
CREATE INDEX "DealDocument_dealId_idx" ON "DealDocument"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "DealDocument_dealId_versionNumber_documentType_key" ON "DealDocument"("dealId", "versionNumber", "documentType");

-- CreateIndex
CREATE INDEX "Signature_dealId_idx" ON "Signature"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "Signature_documentId_partyId_key" ON "Signature"("documentId", "partyId");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_idx" ON "DealEvent"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "DealEvent_dealId_sequence_key" ON "DealEvent"("dealId", "sequence");

-- CreateIndex
CREATE INDEX "DealComment_dealId_idx" ON "DealComment"("dealId");

-- CreateIndex
CREATE INDEX "PaymentRecord_dealId_idx" ON "PaymentRecord"("dealId");

-- CreateIndex
CREATE INDEX "Obligation_dealId_idx" ON "Obligation"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_dealId_idx" ON "Invitation"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "DealSeal_serialNumber_key" ON "DealSeal"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DealSeal_verificationToken_key" ON "DealSeal"("verificationToken");

-- CreateIndex
CREATE INDEX "DealSeal_dealId_idx" ON "DealSeal"("dealId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_partyId_idx" ON "Notification"("partyId");

-- CreateIndex
CREATE INDEX "AdminAudit_actorUserId_idx" ON "AdminAudit"("actorUserId");
