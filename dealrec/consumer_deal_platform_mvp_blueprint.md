# PRODUCT REQUIREMENTS & ENGINEERING BLUEPRINT
## Consumer Digital Deal, Agreement & Evidence Platform — Nigeria
**Document type:** MVP Product Requirements Document (PRD) + Engineering Build Specification  
**Version:** 1.0  
**Status:** Build specification  
**Primary market:** Nigeria  
**Primary users:** Individuals, traders, freelancers, landlords, tenants, small businesses, informal lenders, buyers and sellers

---

## 1. Product direction

### 1.1 Product concept

Build a mobile-first web application that helps people document everyday agreements and business dealings, obtain clear confirmation from everyone involved, track what each person has promised or paid, and preserve a reliable record if a disagreement occurs.

This is not merely a PDF signing tool. It is a **deal-record and trust platform**.

A user should be able to create a deal, invite the other party through a link, agree the terms, sign, record payments and messages, and download a consolidated evidence pack.

### 1.2 Core promise

**Put the deal on record. Know what was agreed. Keep proof of what happened.**

The platform should make it easier to answer:

- Who were the parties?
- What exactly did they agree to?
- Which version did each person approve?
- When did each person review and sign?
- What money was due, paid or outstanding?
- What messages, receipts or changes followed?
- Can the original record be checked for alteration?

Do not promise that the app makes agreements impossible to dispute, guarantees recovery of money, or automatically makes every document admissible in court. It provides structured records and technical evidence that may assist in proving a transaction, subject to applicable law and the court's assessment.

### 1.3 Product differentiation

The product combines five functions in one simple workflow:

1. Guided deal creation using locally relevant templates.
2. Counterparty review, comments and electronic signing through a no-account link.
3. A permanent, versioned deal timeline.
4. Payment and obligation tracking.
5. A platform verification seal, QR check and downloadable evidence pack.

The differentiator is the **complete lifecycle of a deal**, not the signature alone.

---

## 2. Target users and priority use cases

Do not launch by trying to serve every possible legal document. Begin with common transactions where people frequently rely on WhatsApp messages, handwritten notes and bank-transfer screenshots.

### 2.1 Initial customer groups

- Individuals lending or borrowing money.
- Buyers and sellers of goods, phones, electronics, furniture and vehicles.
- Freelancers and independent service providers.
- Small traders and suppliers.
- Landlords and tenants documenting tenancy terms and payments.
- Small businesses documenting orders, deposits and instalments.

### 2.2 MVP deal templates

Launch with a small, carefully reviewed library. Each template should be a guided form that generates a clear agreement in plain English.

| Template | Core terms to capture |
|---|---|
| Personal loan | Principal, repayment date/schedule, interest if any, payment method, default steps |
| Sale of goods | Item description, condition, price, deposit, balance, delivery and inspection |
| Service/freelance agreement | Scope, deliverables, milestones, fee, revisions, deadlines and acceptance |
| Deposit and balance agreement | Purpose, amount received, balance, deadline, cancellation and refund terms |
| Instalment payment agreement | Total price, instalments, due dates, late/default consequences |
| Supply/order agreement | Goods/services, quantity, price, delivery date, inspection and payment |
| Rent/tenancy record | Parties, premises description, term, rent, deposit, payment dates and obligations |
| Vehicle sale record | Vehicle details, seller/buyer, price, payment, handover, disclosed defects and documents |
| Acknowledgement of debt | Amount owed, reason, repayment terms and acknowledgement |
| General agreement | Guided party, subject, consideration/payment, obligations, dates and additional terms |

**Important scope control:** A tenancy record or vehicle-sale agreement does not itself complete statutory perfection, title transfer, registration or other formalities. Land transfers, wills, powers of attorney, court documents and other regulated or formality-dependent instruments must be clearly flagged for professional/legal handling. Do not present the MVP as a substitute for required stamping, registration, consent, witnessing, notarisation or other formalities.

### 2.3 Template governance

- Templates must be reviewed by qualified Nigerian legal practitioners before publication.
- Display template version and review date.
- Include a plain-language explanation of what each template is intended for.
- Ask users to confirm that the template fits their transaction.
- Allow additional terms, but warn users that custom terms may need legal review.
- Keep a template change history. Do not silently change a template already used in a deal.
- Do not label a template “court-approved”. Use wording such as “Reviewed by Nigerian legal practitioners” only where that review has actually occurred.

---

## 3. Product principles

1. **Counterparty friction must be minimal.** The invited party should be able to open a secure link, review and sign without installing an app or creating a full account.
2. **Mobile first.** Design for ordinary Android phones, small screens, low bandwidth and intermittent connections.
3. **Plain language.** Avoid legal and technical language in the main user journey.
4. **One deal, one record.** Every document, comment, signature, payment, receipt and reminder belongs to a deal.
5. **Preserve history.** Never overwrite an executed document or silently edit a historical event.
6. **Be honest about proof.** Distinguish a server-recorded event from independent cryptographic proof or verified identity.
7. **Keep the MVP operable.** Avoid unnecessary microservices, blockchain, AI features and complex enterprise controls.
8. **Privacy by design.** Collect only the information required for the transaction and its evidence record.

---

## 4. MVP scope

The MVP must include the following modules. These are not optional future ideas; together they form the minimum useful product.

### MODULE A — Accounts and user profiles

**Purpose:** Let a user create and manage deals.

Features:
- Sign up and sign in using email and password, with email verification.
- Add and verify a phone number using OTP.
- Basic profile: full name, email, phone number.
- Password reset and secure session management.
- View deals created, deals received and archived deals.
- Basic account security and logout from sessions.

Do not require BVN or NIN for ordinary MVP use. Design the identity layer so a licensed third-party verification provider can be added later. Do not collect or store BVN/NIN directly unless there is a clear lawful basis, provider arrangement, security assessment and approved product need.

### MODULE B — Deal creation and guided templates

**Purpose:** Turn an informal transaction into a clear written record.

User flow:
1. User selects “Create a deal”.
2. User chooses a template or uploads a PDF.
3. User enters the deal title and transaction details.
4. User adds the other party's name and contact details.
5. User defines the amount, dates, obligations and payment milestones where relevant.
6. User previews the generated agreement.
7. User sends it to the other party for review.

Requirements:
- Guided, step-by-step form with progress indicator.
- Save as draft automatically.
- Plain-language field descriptions and examples.
- Support NGN formatting and Nigerian date/time display.
- Support PDF generation from templates.
- Allow PDF upload in MVP.
- DOCX conversion may be deferred if it creates unnecessary complexity.
- Require users to identify each party's role.
- Show a clear preview before sending.
- Record the exact template version and generated document version.

For a custom uploaded document, the creator should be able to add deal metadata and invite parties. Advanced drag-and-drop signature field placement can be kept simple initially: parties sign on a designated execution page or signature block generated by the platform.

### MODULE C — Counterparty invitation and signing

**Purpose:** Make it easy for the other party to participate.

Flow:
1. Creator sends an invitation link by copying it into WhatsApp, SMS or email.
2. Recipient opens the link in a mobile browser.
3. Recipient sees the creator's name, deal title and invitation context.
4. Recipient verifies control of their email or phone using a one-time code or secure verification link.
5. Recipient reviews the complete agreement.
6. Recipient can accept, decline or request a change.
7. If accepted, recipient confirms their name and signs electronically.
8. Both parties receive confirmation and access to the final record.

Requirements:
- No app download required.
- No full account creation required for the invited party in MVP.
- Link must be random, unguessable, time-limited where appropriate, revocable and scoped to the specific deal/action.
- OTP expiry, resend limits and rate limits.
- Record which authentication method was used.
- Capture explicit intent to sign, such as a checkbox and a clear “Sign agreement” action.
- Capture typed name and a drawn or typed electronic signature representation.
- Record timestamp, IP address and user-agent at the time of the signing event.
- Explain that IP address and device information are technical metadata, not conclusive proof of a person's physical identity.
- Provide the signer with a copy of the document and signing confirmation.

**Signature model:** The MVP provides an electronic signing workflow and evidence record. Do not describe a typed/drawn signature image alone as a qualified digital signature or as guaranteed proof of identity. Consider a standards-based PDF digital-signature implementation in a later hardening phase.

### MODULE D — Deal discussion and correspondence timeline

**Purpose:** Keep deal-related communications attached to the agreement.

Do not build a general-purpose chat system.

MVP features:
- A chronological activity feed for each deal.
- Parties can post a comment or clarification.
- Creator can propose revised terms by generating a new document version.
- Recipient can request a change or reject the current version.
- Every material change creates a new version.
- Previous versions remain available and are marked superseded where applicable.
- Record sender, timestamp and message content.
- Record delivery/open events as server-observed events where technically available.
- Allow parties to attach a receipt or supporting file, subject to file limits and security checks.

Rules:
- Sent comments cannot be edited or deleted in the normal user interface.
- If correction is necessary, allow a follow-up correction message.
- Do not describe ordinary database logs as mathematically immutable.
- Use append-only application permissions and a hash-chained event log to make undetected alteration more difficult.
- Clearly distinguish “link delivered”, “link opened”, “document viewed” and “signed”. A link opening does not prove that a person read or understood every word.

### MODULE E — Version control and execution lock

**Purpose:** Prevent disputes about which terms were signed.

Requirements:
- Each draft has a version number.
- Every revision generates a new immutable file record.
- A change summary identifies fields changed between generated template versions.
- When a party signs a version, store the exact file hash and version identifier.
- If any term changes after one party signs, the system must not treat the old signature as approval of the new version.
- Any material amendment after execution must create an amendment document or a new deal version requiring fresh approval/signatures.
- Final execution occurs only when all required parties have signed the same final version.
- Once fully executed, the final file is locked against replacement.
- A deal may be marked voided, cancelled or superseded, but its history must remain available.

### MODULE F — Payment and obligation tracker

**Purpose:** Make the app useful after signing.

MVP features:
- Record agreed total amount.
- Add payment milestones or instalment schedule.
- Record a payment manually.
- Record amount, date, payer, recipient, reference and payment channel.
- Upload payment evidence such as transfer receipt.
- Calculate amount paid and outstanding.
- Mark an obligation as completed, pending or disputed.
- Show upcoming and overdue dates.
- Send basic email reminders; SMS reminders can be added if affordable.
- Display a chronological payment history.

**Critical distinction:** In MVP, the platform records payments; it does not hold, transfer, guarantee or escrow users' money. A manually recorded payment is not independently verified. Label it “Recorded by [party]” unless a payment provider has confirmed it through an integration. Escrow and payment initiation require a properly structured licensed-partner arrangement and should be deferred.

### MODULE G — Platform verification seal and QR verification

**Purpose:** Give every completed deal a consistent identity and make document checks straightforward.

Create a distinctive **Platform Deal Verification Seal**. It must not imitate the NBA stamp and seal, government seals, notarial seals or any professional regulatory credential.

Suggested seal fields:
- Platform name and logo.
- Unique deal/document reference.
- Unique seal serial number.
- Date and time of execution, including timezone.
- Number of signatories.
- Verification level (for example, email verified / phone OTP verified).
- Short hash fingerprint.
- QR code and verification URL.
- Status: Valid record, Voided, Superseded or Verification unavailable.

Suggested label:
**“Platform Deal Verification — Electronic Record”**

Include a visible disclaimer:
“This is a platform verification mark. It is not an NBA stamp or seal, notarial seal, government certification or guarantee of legal validity.”

PDF output:
- Add a discreet document ID and page numbering to generated documents.
- Add a final verification/certificate page after execution.
- Place the seal and QR code on the certificate page.
- Do not alter the signed content after final hashing without generating a new hash and recording the relationship between the files.

**Correct document hashing sequence:**
1. Generate the final agreement, including platform watermark and page numbering.
2. Collect all required signatures and freeze the executed agreement.
3. Calculate SHA-256 over the exact executed agreement file.
4. Store the hash and execution metadata.
5. Generate a separate certificate/evidence PDF referencing that hash, or package it alongside the agreement.
6. If the certificate is appended to create a combined PDF, calculate and store a separate hash for that combined file. Never claim that a hash embedded in a file is the hash of that same final file unless the cryptographic design explicitly supports it.

### MODULE H — Evidence certificate and downloadable evidence pack

**Purpose:** Produce a consistent, understandable record for the parties and potential later review.

For each completed deal, generate:
1. Final executed agreement PDF.
2. Deal verification certificate PDF.
3. Event/audit history in PDF or CSV.
4. Relevant correspondence and change history.
5. Payment records and uploaded receipts, if any.
6. File manifest containing SHA-256 hashes.
7. A simple README explaining how to verify the files.

Certificate should include, where applicable:
- Deal reference and title.
- Parties' names and stated roles.
- Contact details in appropriately masked form where possible.
- Authentication method used by each signer.
- Signing timestamps and timezone.
- Document version and hash.
- Platform event-log reference.
- Description of the platform's recording process.
- System/operator details required for a properly prepared Evidence Act certificate, where established and reviewed by Nigerian counsel.
- QR verification URL.
- Limitations and disclaimer.

**Nigerian evidence-law design note:** Section 93 of the Evidence Act 2011 (as amended) addresses electronic signatures. Section 84 is central to admissibility of computer-generated evidence and its statutory conditions/certificate. The product must be designed with both provisions and other applicable rules in view. Do not automatically label a generated certificate a compliant Section 84 certificate merely because it contains a hash and timestamps. Nigerian evidence counsel must settle the certificate wording, responsible person/operator, system description, process, statutory conditions and operational procedure before the product makes that claim.

The evidence pack is intended to preserve relevant records and assist later proof. It does not guarantee admissibility or success in litigation.

### MODULE I — Public verification page

**Purpose:** Allow a recipient, lawyer or other authorised reviewer to check a document reference.

The QR code opens a public verification page.

Public page should show only limited information:
- Whether the reference exists.
- Current status.
- Deal/document reference.
- Execution date.
- Number of signatories.
- Short hash fingerprint.
- Whether an uploaded PDF matches the stored hash, if upload verification is enabled.

Do not publicly expose phone numbers, email addresses, IP addresses, full contract contents, payment receipts or private correspondence.

For stronger privacy, the public page should not reveal the parties' names by default. A party may share a separate access link or consent to limited disclosure.

Verification should support:
- Scan QR / open URL.
- Enter reference code.
- Upload a PDF to compare its SHA-256 hash with the stored executed file hash.
- Display “Exact file match” or “No match”. A mismatch means the uploaded file differs; it does not by itself prove fraud.

### MODULE J — Notifications and reminders

MVP notifications:
- Invitation sent.
- Agreement viewed, where tracked.
- Change requested.
- Agreement signed by a party.
- Deal fully executed.
- Payment recorded.
- Payment due soon.
- Payment overdue.
- Deal obligation due.
- Deal cancelled or superseded.

Start with in-app and email notifications. Add SMS notifications only for important events if cost permits. WhatsApp Business API integration is not required for MVP: use shareable links that users can send through WhatsApp.

---

## 5. Main user journeys

### Journey 1 — Personal loan

1. User selects “Personal loan”.
2. Enters lender and borrower details, principal, repayment date and agreed instalments.
3. Adds any agreed interest or records that the loan is interest-free.
4. Previews the agreement.
5. Sends the link to the borrower through WhatsApp.
6. Borrower verifies phone/email, reviews and signs.
7. Lender signs.
8. Platform locks the executed version, calculates the hash and generates the seal and evidence pack.
9. Lender records disbursement and uploads transfer evidence.
10. Borrower/lender can record repayments.
11. Dashboard shows amount paid, outstanding amount and next due date.
12. Both parties can download the record at any time.

### Journey 2 — Sale of goods

1. Seller chooses “Sale of goods”.
2. Adds item description, condition, price, deposit, balance and delivery date.
3. Buyer receives a link and reviews the terms.
4. Both parties sign.
5. Seller records deposit/payment and later balance.
6. Seller records delivery; buyer may acknowledge receipt.
7. Evidence pack contains agreement, payment events, receipt attachments and delivery acknowledgement.

### Journey 3 — Freelance/service engagement

1. Service provider chooses “Service agreement”.
2. Defines scope, deliverables, milestones, price, revision limits and due dates.
3. Client reviews and requests changes if necessary.
4. Revised version is generated and signed by both parties.
5. Milestone payments and deliverables are tracked.
6. Client can acknowledge completion or raise a recorded issue.

### Journey 4 — Uploaded agreement

1. User uploads a PDF.
2. Adds deal title, parties and contact details.
3. Invites the other party.
4. Both parties review and sign through the execution flow.
5. Platform generates a signing record, verification reference and evidence pack.
6. The original uploaded file is preserved separately from the executed file.

---

## 6. Screens and navigation

Keep navigation simple.

### Main navigation
- **Home**
- **My Deals**
- **Create Deal**
- **Notifications**
- **Profile**

### Required screens

1. Landing page — concise explanation, use cases, trust explanation and CTA.
2. Sign up / sign in.
3. User profile and verification.
4. Dashboard — active deals, awaiting my action, payments due, overdue items.
5. Deal template selection.
6. Guided deal form.
7. Agreement preview.
8. Invite counterparty.
9. Recipient review/sign page (no account required).
10. Deal workspace:
   - Overview
   - Agreement and versions
   - Activity/discussion
   - Payments
   - Evidence and verification
11. Public verification page.
12. Notification centre.
13. Profile/security settings.
14. Admin dashboard.

### Dashboard priorities

Show users what needs attention, not vanity statistics:
- “Waiting for the other party to sign”
- “You need to sign”
- “₦150,000 payment due in 3 days”
- “₦80,000 outstanding”
- “One deal is overdue”
- “All parties have signed”

---

## 7. Deal lifecycle and statuses

Suggested deal statuses:

- `DRAFT`
- `AWAITING_COUNTERPARTY`
- `UNDER_REVIEW`
- `CHANGE_REQUESTED`
- `AWAITING_CREATOR_SIGNATURE`
- `AWAITING_OTHER_SIGNATURES`
- `EXECUTED`
- `ACTIVE`
- `COMPLETED`
- `OVERDUE`
- `CANCELLED`
- `VOIDED`
- `SUPERSEDED`

Do not use one status field to represent every aspect of a deal. Payment status and obligation status should be calculated or tracked separately.

Example:
- Deal status: `ACTIVE`
- Payment status: `PARTIALLY_PAID`
- Next obligation: `DUE_SOON`

All state transitions must be validated on the server. A client must not be able to mark a deal executed by changing frontend state.

---

## 8. Platform seal design

### 8.1 Seal identity

Use a distinct visual identity, for example a circular or rectangular seal with:
- Platform logo.
- “DEAL RECORD VERIFIED”.
- Unique serial.
- QR code.
- Execution date.
- Short document fingerprint.

Avoid visual imitation of the NBA seal or official government insignia. Do not use the words “NBA”, “officially certified”, “notarised” or “court approved” unless a separate lawful basis and authority exist.

### 8.2 Seal statuses

- `ACTIVE`: the stored record is available and matches the registered hash.
- `VOIDED`: the platform record has been marked void, with reason and timestamp.
- `SUPERSEDED`: a later amendment or replacement record exists.
- `REVOKED`: reserved for a defined security or administrative revocation process.
- `UNAVAILABLE`: verification service cannot currently confirm the record.

Never erase the historical seal event when status changes. Show the current status and retain the event history.

### 8.3 Cryptographic implementation

MVP:
- SHA-256 hash of each final document.
- Random unique document reference and seal serial.
- Hash-chained audit events.
- Secure key management for any signing keys.
- HTTPS everywhere.
- Private object storage and short-lived signed download URLs.
- Backups and tested restoration.

Later hardening:
- Standards-based PDF digital signatures (PAdES).
- RFC 3161 trusted timestamp authority.
- Key storage in a managed KMS/HSM.
- Independent security review and penetration testing.
- Periodic external anchoring of audit-log hashes.

Do not add blockchain simply for marketing. It does not solve identity, consent, key custody, privacy or operational governance by itself.

---

## 9. Legal, privacy and trust requirements

This product is intended for the Nigerian market. Obtain specialist legal review before launch and before making claims about evidence or enforceability.

### 9.1 Evidence and electronic signatures

- Consider the Evidence Act 2011 as amended, including Sections 84 and 93.
- Design the event records and certificate process around the actual statutory requirements.
- Preserve original source files and executed versions.
- Record the system, process, relevant operator and event details needed for evidence certification.
- Maintain documented operating procedures for evidence export and certificate issuance.
- Do not guarantee that a contract is enforceable merely because it was signed in the app.
- Flag transactions requiring additional statutory formalities, witnesses, stamping, registration, consent or professional advice.

### 9.2 Data protection

Design for compliance with the Nigeria Data Protection Act 2023 and applicable NDPC requirements.

Minimum controls:
- Clear privacy notice and lawful-basis assessment.
- Purpose limitation and data minimisation.
- Consent where consent is the appropriate lawful basis.
- Retention and deletion policy, including legal preservation exceptions.
- Data-subject request process.
- Processor agreements with hosting, email, SMS and verification vendors.
- Access controls and audit logs.
- Encryption in transit and at rest.
- Incident response and breach assessment/notification procedure.
- Privacy impact assessment where appropriate.
- Assess cross-border transfers and vendor locations.
- Avoid collecting sensitive identity data without a defined need and safeguards.

### 9.3 Identity and authentication

MVP verification means proving control of a contact channel, not proving civil identity beyond doubt.

Use accurate labels:
- Email verified.
- Phone number verified.
- Identity checked by named third-party provider (only after actual provider verification).
- Additional identity check completed.

Do not display a generic “Identity verified” badge when only an OTP was completed.

### 9.4 Disputes and liability

- Terms of use should explain platform role and limitations.
- The platform is not a party to users' contracts.
- Do not guarantee payment, performance, recovery, admissibility or legal outcomes.
- Provide a process to report account compromise, fraudulent invitations or disputed records.
- Preserve records subject to lawful retention and dispute holds.
- Provide a clear correction/complaint process without rewriting historical records.

---

## 10. Recommended technical architecture

Keep the architecture deliberately simple for a small team.

### 10.1 Recommended stack

| Layer | Recommendation | Reason |
|---|---|---|
| Frontend | Next.js App Router + TypeScript | Responsive PWA and shared type safety |
| UI | Tailwind CSS + a consistent component library | Fast, maintainable interface |
| Backend | Next.js server routes initially, or a single NestJS/Express API | Avoid multiple services in MVP |
| Database | PostgreSQL | Relational deal, party, payment and audit data |
| ORM | Prisma | Familiar schema and migrations |
| Authentication | Auth.js or a managed auth provider | Avoid building password/session security from scratch |
| File storage | Cloudflare R2 or S3-compatible private storage | Store PDFs and evidence attachments |
| PDF | pdf-lib | Generate agreement and certificate PDFs |
| QR | QR code library | Encode verification URL |
| Hashing | Node.js crypto SHA-256 | Hash exact file bytes |
| Email | Resend, Postmark or equivalent | Invitations and notices |
| SMS | Termii or another Nigerian gateway | OTP and critical reminders |
| Hosting | Vercel + managed PostgreSQL + R2 | Low operational burden |
| Payments | Payment gateway only for buying platform credits | Do not hold deal funds |

Choose one provider per function for the MVP. Do not build a microservice architecture. Do not introduce pgvector unless a real search/AI feature requires it.

### 10.2 High-level architecture

```text
Mobile / Desktop Browser (Next.js PWA)
              |
              | HTTPS
              v
      Single Application Backend
       |       |        |       |
       v       v        v       v
   PostgreSQL  R2     Email   SMS OTP
       |
       v
 Deals, parties, versions, signatures,
 payments, events, verification records
```

### 10.3 Engineering principles

- Server-side authorisation for every deal and file operation.
- Role and party checks on every endpoint.
- Private files by default.
- Short-lived signed URLs for downloads.
- Validate and scan uploaded files; restrict MIME types and file sizes.
- Never trust a client-supplied hash, timestamp, status or signer identity.
- Store timestamps in UTC; display in Africa/Lagos time.
- Use database transactions for signing and execution state changes.
- Use idempotency keys for operations that may be retried.
- Rate-limit OTP, invitation and public verification endpoints.
- Keep secrets in environment variables/managed secret storage.
- Use structured logs without leaking document contents or OTP values.
- Automated database backups and periodic restore tests.
- Separate development, staging and production environments.

---

## 11. Initial database model

The following is a starting point, not a requirement to implement every optional field immediately.

### `User`
- `id`
- `fullName`
- `email`
- `emailVerifiedAt`
- `phoneNumber`
- `phoneVerifiedAt`
- `passwordHash` or auth-provider identifier
- `createdAt`
- `updatedAt`

### `Deal`
- `id`
- `reference`
- `title`
- `dealType`
- `creatorId`
- `status`
- `currency` (default `NGN`)
- `totalAmount`
- `createdAt`
- `updatedAt`
- `executedAt`
- `completedAt`

### `DealParty`
- `id`
- `dealId`
- `userId` (nullable for invited non-account party)
- `fullName`
- `email`
- `phoneNumber`
- `role`
- `invitationStatus`
- `authenticationLevel`
- `joinedAt`

### `DealDocument`
- `id`
- `dealId`
- `versionNumber`
- `documentType` (draft, uploaded_original, execution_copy, amendment, certificate)
- `storageKey`
- `mimeType`
- `fileSize`
- `sha256`
- `createdBy`
- `createdAt`
- `isFinal`

### `Signature`
- `id`
- `dealId`
- `documentId`
- `partyId`
- `signatureType`
- `signerName`
- `authenticationMethod`
- `signedAt`
- `ipAddress`
- `userAgent`
- `consentTextVersion`
- `signatureAssetKey` (if a visual signature image is retained)

### `DealEvent`
- `id`
- `dealId`
- `actorPartyId` (nullable for system event)
- `eventType`
- `description`
- `metadataJson`
- `createdAt`
- `previousEventHash`
- `eventHash`

### `DealComment`
- `id`
- `dealId`
- `authorPartyId`
- `message`
- `attachmentDocumentId` (nullable)
- `createdAt`

### `PaymentRecord`
- `id`
- `dealId`
- `recordedByPartyId`
- `amount`
- `currency`
- `paymentDate`
- `paymentMethod`
- `reference`
- `verificationStatus` (unverified, provider_confirmed, disputed)
- `receiptDocumentId`
- `notes`
- `createdAt`

### `Obligation`
- `id`
- `dealId`
- `responsiblePartyId`
- `title`
- `description`
- `dueAt`
- `status`
- `completedAt`

### `DealSeal`
- `id`
- `dealId`
- `documentId`
- `serialNumber`
- `verificationToken`
- `status`
- `issuedAt`
- `revokedAt`
- `revocationReason`

### `Notification`
- `id`
- `userId` or `partyId`
- `dealId`
- `type`
- `channel`
- `status`
- `sentAt`
- `readAt`

### Important relationships and constraints

- A deal has multiple parties, document versions, events, comments, payments and obligations.
- A signature must reference one exact document version.
- A completed execution must have all required signatures on the same final version.
- A final document hash must never be overwritten.
- A seal must reference the exact document it verifies.
- A public verification token must be random and non-sequential.
- Payment records must retain who recorded them and whether a provider independently confirmed them.

---

## 12. API capability outline

Implement endpoints according to the chosen backend conventions. Example REST resources:

```text
POST   /api/deals
GET    /api/deals
GET    /api/deals/:dealId
PATCH  /api/deals/:dealId/draft
POST   /api/deals/:dealId/invitations
GET    /api/invitations/:token
POST   /api/invitations/:token/verify
POST   /api/deals/:dealId/comments
POST   /api/deals/:dealId/versions
GET    /api/deals/:dealId/documents
POST   /api/deals/:dealId/signatures
POST   /api/deals/:dealId/execute
POST   /api/deals/:dealId/payments
POST   /api/deals/:dealId/obligations
POST   /api/deals/:dealId/evidence-pack
GET    /api/verify/:verificationToken
POST   /api/verify/:verificationToken/check-file
GET    /api/deals/:dealId/events
```

Every endpoint must enforce access permissions. Public invitation and verification endpoints must expose only the minimum necessary data.

---

## 13. Security and audit requirements

### MVP security checklist

- Passwords hashed using a modern password hashing algorithm if credentials are managed by the app.
- Multi-factor or step-up authentication for sensitive account actions where feasible.
- OTPs stored hashed where practical, expire quickly and are rate-limited.
- Invitation tokens generated using cryptographically secure randomness.
- CSRF protection where applicable.
- Secure, HttpOnly, SameSite cookies.
- Content Security Policy and secure headers.
- Input validation and output encoding.
- SQL injection protection through parameterised ORM queries.
- File type, size and malware checks.
- Private object storage; no permanent public file URLs.
- Encryption in transit and at rest.
- Role-based access control and least privilege.
- Admin actions logged.
- Audit events append-only at application level and hash chained.
- Backups encrypted and restoration tested.
- No OTP, password or full contract content in application logs.
- Security review before handling real customer documents.

### Audit event examples

- `DEAL_CREATED`
- `PARTY_INVITED`
- `INVITATION_DELIVERED`
- `INVITATION_OPENED`
- `CONTACT_VERIFIED`
- `DOCUMENT_VIEWED`
- `COMMENT_ADDED`
- `CHANGE_REQUESTED`
- `DOCUMENT_VERSION_CREATED`
- `SIGNATURE_INTENT_CONFIRMED`
- `PARTY_SIGNED`
- `DEAL_EXECUTED`
- `PAYMENT_RECORDED`
- `RECEIPT_ATTACHED`
- `OBLIGATION_COMPLETED`
- `DEAL_VOIDED`
- `EVIDENCE_PACK_GENERATED`

A hash chain can make retrospective modification detectable if implemented and verified correctly. It does not make a database literally impossible to alter. Protect the chain with restricted access, backups and independent timestamping in a later phase.

---

## 14. Monetisation

Use a free entry point and charge when the user receives meaningful transaction protection.

### Suggested initial pricing to test

| Plan | Suggested offer |
|---|---|
| Free | One basic deal per month, standard record and limited storage |
| Single Deal | Pay per completed deal; test ₦1,500–₦3,500 |
| Enhanced Deal | Higher-value transaction pack with additional verification or longer retention; test ₦3,500–₦7,500 |
| Professional | Multiple active deals, reusable templates and higher storage limits |
| Business | Team members, shared workspace, branded documents and higher deal volume |

These are hypotheses, not validated market prices. Test willingness to pay with real users before fixing the price.

Potential paid add-ons later:
- Third-party identity verification.
- Lawyer review of an agreement.
- Lawyer witnessing or other legally appropriate services.
- Custom agreement drafting.
- Extended evidence archive.
- Demand-letter preparation by a qualified legal practitioner.
- Business/API integrations.

Do not imply that buying an add-on guarantees enforcement or recovery.

---

## 15. Admin dashboard

A small internal admin area is required to operate the MVP.

Admin capabilities:
- View users and deal counts.
- View deal references and statuses, with access to content restricted and logged.
- Manage templates and template versions.
- Suspend abusive accounts or revoke compromised invitation links.
- Review reported issues.
- View notification failures.
- View storage and system usage.
- View seal status and verification failures.
- Export operational reports.

Admin users must not be able to silently alter signed documents, signatures or historical events. Any administrative status change must create an audit event.

---

## 16. MVP acceptance criteria

The MVP is not complete until all of the following work end to end:

### Deal creation
- A registered user can create a deal using at least five launch templates.
- User can save a draft and return to it.
- User can preview and generate a PDF.
- User can upload a PDF and create a deal record around it.

### Counterparty experience
- Creator can invite a counterparty using a shareable link.
- Recipient can open the link on a mobile browser without creating an account.
- Recipient can verify email or phone.
- Recipient can review the agreement and accept, decline or request changes.
- Recipient can sign the exact version presented.

### Versioning and signing
- Every revision creates a new version.
- A signature is tied to one exact document version.
- A revised document cannot inherit an earlier signature.
- The deal is executed only when all required parties sign the same final version.
- Executed documents cannot be silently replaced.

### Deal record
- Parties can post comments.
- Activity timeline records important events and timestamps.
- Payment entries and receipts can be added.
- Outstanding balances and due dates are displayed correctly.
- Reminders can be sent.

### Verification and evidence
- Final document SHA-256 is calculated server-side.
- A unique seal and QR verification URL are generated.
- Public verification page shows limited information.
- Uploading the exact file returns a match.
- Uploading a modified file returns no match.
- User can download the executed agreement and evidence pack.
- Evidence pack contains a manifest and clear explanation of limitations.

### Security and operations
- Users cannot access another user's private deals.
- Invited parties can access only the deal associated with their secure invitation.
- Private files cannot be fetched through guessable public URLs.
- OTP and invitation endpoints are rate-limited.
- Backups and restoration procedure are tested.
- Admin actions are logged.

---

## 17. Recommended build sequence

Build in vertical slices. Each slice should be usable and testable before moving on.

### Phase 1 — Foundation
- Next.js project, TypeScript, UI system and responsive layout.
- PostgreSQL and Prisma.
- Authentication and profile.
- Deal, party and document data models.
- Private file storage.
- Basic admin access.

### Phase 2 — Create a deal
- Template selection.
- Guided forms for the first five templates.
- Agreement PDF generation.
- Draft saving and preview.
- PDF upload.
- Deal dashboard.

### Phase 3 — Invite and sign
- Secure invitation links.
- Email/phone verification.
- Recipient no-account flow.
- Agreement review.
- Comment/change request.
- Version creation.
- Signature capture and consent.
- Execution state machine.

### Phase 4 — Evidence and platform seal
- Server-side SHA-256 hashing.
- Deal event ledger and hash chaining.
- PDF watermark and page numbering.
- Platform seal and QR code.
- Public verification page.
- Evidence certificate and downloadable evidence pack.

### Phase 5 — Deal tracking
- Payment schedule.
- Manual payment records and receipts.
- Outstanding balance calculation.
- Obligations and due dates.
- Email notifications and reminders.

### Phase 6 — Pilot and hardening
- Nigerian legal review of templates and evidence certificate.
- Privacy and security review.
- Test on low-cost Android devices and weak networks.
- Pilot with 20–50 real users across selected use cases.
- Measure invitation completion, signing completion, repeat use and willingness to pay.
- Fix friction and reliability problems before adding features.

---

## 18. Features deliberately deferred

Do not build these into the first MVP unless user testing demonstrates a compelling need.

### Identity and trust
- BVN/NIN verification.
- Liveness/selfie checks.
- Biometric signing.
- Reputation scores or public user ratings.
- Automated fraud scoring.

### Payments
- Escrow.
- Holding customer funds.
- Direct bank transfers or payment initiation.
- Automatic bank-statement reconciliation.
- Lending or credit scoring.

### Legal services
- Lawyer marketplace.
- Automated demand letters.
- In-app mediation or arbitration.
- Notarisation workflows.
- NBA digital seal integration.
- Automated legal advice or AI contract interpretation.

### Advanced document features
- Full DOCX editor.
- Complex drag-and-drop signature fields.
- Advanced redlining and clause comparison.
- Bulk signing.
- Recurring contract automation.
- PAdES signing and RFC 3161 timestamp integration, until the core workflow is stable.

### Platform expansion
- Native Android/iOS apps.
- Full WhatsApp Business API integration.
- Multiple languages and voice-to-contract.
- AI-generated contracts.
- Blockchain anchoring.
- Enterprise SSO, advanced team permissions and custom APIs.

---

## 19. Product metrics

Measure whether the app actually helps people complete and preserve deals.

Primary metrics:
- Deal creation completion rate.
- Percentage of invited counterparties who open the link.
- Percentage of opened invitations that complete verification.
- **Counterparty signing completion rate.**
- Median time from invitation to completed signing.
- Percentage of executed deals with payment/obligation tracking used.
- Evidence-pack download rate.
- Repeat deal creation within 60 days.
- Paid conversion rate.
- Support complaints and failed invitation rate.

The most important early activation metric is:

**Of all deals sent for signature, what percentage are fully signed by every required party?**

If recipients open invitations but do not sign, investigate trust, clarity, price, OTP friction and mobile usability before adding more features.

---

## 20. Pilot and go-to-market recommendation

Start with three high-frequency use cases rather than marketing the platform as a solution for every legal transaction:

1. Personal loans and acknowledgements of debt.
2. Deposits, instalments and sale of goods.
3. Freelance/service agreements.

Recruit a small pilot group of individuals, traders, freelancers and small businesses. Observe real transactions, not just demonstrations.

Marketing message examples:
- “Lending money? Put the repayment terms on record before you transfer.”
- “Taking a deposit? Record what it covers, when the balance is due and what happens if the deal is cancelled.”
- “Selling an item? Agree the price, condition and delivery terms before handover.”
- “Doing freelance work? Put the scope, milestones and payment dates in writing.”

The strongest acquisition loop is the counterparty invitation. Every deal exposes another person to the product. Make the recipient experience fast, clear and trustworthy.

---

## 21. Brand and user-facing language

Avoid presenting the product as a law-firm tool or using intimidating legal language.

Possible positioning:
- **Put it on record.**
- **Every deal deserves proof.**
- **Agree clearly. Sign securely. Keep the record.**

Suggested primary CTA:
**Create a Deal**

Suggested homepage explanation:
“Whether you're lending money, collecting a deposit, selling something or providing a service, create a clear agreement, get everyone to confirm it, and keep the payments and proof in one place.”

Suggested trust explanation:
“We record the agreement, the versions reviewed, the signing events and the transaction updates. You can verify the document and download your records whenever you need them.”

Do not use “tamper-proof”, “indisputable”, “court guaranteed” or “fraud-proof” as absolute marketing claims.

---

## 22. Build-agent instructions

The developer or coding agent must follow these rules:

1. Treat this document as the source of truth for MVP scope.
2. Build a working end-to-end product, not disconnected UI mockups.
3. Prioritise the recipient's mobile signing experience.
4. Use a single deployable application and a managed database/storage setup.
5. Do not introduce microservices, blockchain, AI or complex integrations without approval.
6. Implement server-side validation and authorisation for every sensitive operation.
7. Preserve historical document versions and event records.
8. Tie every signature to the exact document hash/version signed.
9. Keep private documents private and public verification data minimal.
10. Never claim an OTP proves a person's civil identity.
11. Never claim manual payment entries are bank-verified.
12. Never claim the platform seal is an NBA seal, notarial seal or government certification.
13. Do not claim Section 84 compliance until Nigerian counsel has reviewed and approved the actual certificate process.
14. Add automated tests for permissions, signing, versioning, hashing, verification and payment calculations.
15. Keep the interface accessible, fast and usable on low-cost Android devices.
16. Document environment variables, setup, database migrations, deployment and backup procedures.
17. Deliver each phase with a working demo and a short list of completed, incomplete and tested features.

### Required developer deliverables

- Source code repository.
- Database schema and migrations.
- Responsive web application/PWA.
- Seed data for templates and demo deals.
- Automated tests for critical workflows.
- Environment variable example file.
- Deployment instructions.
- Admin guide.
- User guide.
- Security and backup notes.
- Known limitations list.

---

## 23. Final MVP definition

The MVP is successful when an ordinary person can:

1. Create a clear agreement in a few minutes.
2. Send it to another person through WhatsApp.
3. Have that person review and sign without installing an app.
4. Preserve the exact agreed version and a record of the signing process.
5. Record payments, receipts and outstanding obligations.
6. Verify the executed document using its unique reference or QR code.
7. Download a complete, understandable evidence pack.

That is the product. Build this experience exceptionally well before expanding into escrow, identity databases, lawyer marketplaces, AI or enterprise features.

**The guiding product test:** Can two people document a ₦300,000 transaction, sign the same terms, record the payment and retain a verifiable record without needing technical knowledge or a lawyer to operate the app?
