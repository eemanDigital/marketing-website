# User guide

## Create an account

Sign up with your name, email, and password. Enter the one-time code sent to your email. In local development without email configured, the code is shown on screen.

Verify a phone number from **Profile** if you want an additional verified contact channel.

## Create a deal

Choose **New deal**, then pick a template or upload a PDF.

Templates collect the facts that matter for common agreements: parties, amount, dates, repayment or delivery terms, and special conditions. Review everything before creating the record. The generated PDF is a platform record of the information you supplied, not legal advice.

Uploading a PDF preserves your original file byte-for-byte. dealrec adds a signing/record page when the deal executes.

## Invite the other party

Open the deal and use **Invite & sign** to create a link. Share it over WhatsApp, email, SMS, or any channel you already trust.

The invited person verifies control of their email or phone, reviews the agreement, and can accept, request changes, or decline.

To keep access after signing, the invited person can link the deal to a dealrec account. After verifying an email invitation, the page checks whether that email already has an account. If it does, the person signs in and the deal links automatically; if not, they set their name and password and the account is created and linked immediately, without a second verification code. For phone invitations, the person signs in or creates an account, then verifies the invited phone in **Profile**. If already signed in, use **Link this deal to my account** when the verified contact matches. Otherwise, add and verify the invited contact in **Profile**, or sign in with the matching account.

If the other party loses their link, the creator can create a replacement **access link** from the Invite tab even after that party has signed. An access link preserves existing signatures and deal status; it never reopens signing or resets progress.

## Sign

Each required party signs the current version. You can draw a signature, type your name, or upload a PNG, JPG, or WebP signature image (up to 5 MB before processing). Uploaded images are resized to PNG and stored with the signing record. Signing records:

- the document version and SHA-256 hash,
- your consent,
- the authentication method used,
- time and basic request metadata.

A drawn, typed, or uploaded signature image alone does not establish identity and is not a qualified digital signature. The record links the signature method and event to the exact version hash.

## Witnesses

A party can add a witness for itself; the deal creator or an admin can add one for either party. A witness must provide an email address or phone number. That contact is verified with a one-time code before the witness can attest.

After verifying contact, the witness explicitly accepts the invitation to witness. Acceptance records intention only; the witness must still observe the identified party sign the current version and submit a separate attestation afterward. The deal creator and a verified guest counterparty can each invite a witness for their own signature.

Witness details, acceptance time, address, occupation, relationship, signature image (when drawn or uploaded), document hash, attestation time, IP address and device metadata are recorded. The source agreement PDF stays unchanged; use **Executed agreement** to download the copy that includes signature images and witness records after execution.

- Each party can have one witness per document version.
- A new document version supersedes earlier witness attestations.
- Required witnesses block execution until they attest.
- Optional witnesses do not block execution. If they accepted but did not attest before execution, the executed record shows acceptance without claiming an attestation.
- Revoking a required witness removes the block; executed records are locked.
- A witness cannot edit terms, decline, comment, record payments, or sign for a party.

## After signing

When every required party has signed and every required witness has attested, the deal executes automatically:

- an executed copy is generated,
- a verification certificate and seal are issued,
- a public verification link/QR is created,
- notifications are sent.

Later changes require a new version and new signatures.

## Notifications

Every material deal activity creates an in-app notification and is also emailed to each party's saved email address when email is configured. This includes invitations, signatures, witness progress, comments, payments, obligations, and deal status changes. Low-level audit events such as opening a link or viewing a document remain in the Activity tab only and are not emailed.

## Payments, obligations, and comments

- **Payments** record what was paid, when, by whom, and with what reference. A payment record is an entry by a party, not independent proof that money moved. The person who recorded a payment or the deal owner can edit it or void it. Both actions require a reason, notify the other party, and keep the previous values, editor and receipt in the audit record. Voided payments no longer count toward the active total but are never deleted.
- **Obligations** track future actions and due dates; the reminder cron creates notifications. The deal owner, the obligation creator or the responsible party can edit or cancel an obligation. The reason and previous values remain in the audit log and evidence pack.
- **Comments** keep negotiation history with optional attachments. Authors can edit or retract their own comments. An edited comment is marked as edited; a retracted comment stays visible with its reason and original text in the audit record and evidence pack.

Closed deals are read-only. The Activity tab shows the hash-chained audit events for every edit, void or retraction.

## Evidence pack

Download the ZIP from the deal workspace. It includes the agreement and versions, executed copy, certificate, receipts, witness signatures, and a `record.pdf` containing comments, payments, obligations, witnesses and the hash-chained audit trail.

The record files are PDFs, not spreadsheets. This prevents silent row/column edits, accidental reformatting and spreadsheet formula injection. Every file has a SHA-256 hash in `manifest.txt`, and each generated ZIP has a fingerprint recorded in the audit trail and shown on the public verification page. Keep the ZIP and certificate with your own records. dealrec is not a substitute for legal advice or a court process.

## Verify a record

Anyone can use **Verify** with:

- a seal verification link or QR,
- a deal reference and matching invited email/phone (where required),
- a file hash comparison, or
- an evidence ZIP hash comparison against the fingerprints on the verification page.

Verification confirms what the platform recorded and whether the file matches the recorded hash. It does not prove identity, legal validity, or enforceability.

## Limitations

dealrec does not guarantee recovery of money, identity verification, notarisation, government recognition, admissibility, or enforceability. For high-value or complex matters, consult a qualified lawyer and use appropriate independent processes.
