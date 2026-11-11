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

## Sign

Each required party signs the current version. You can draw a signature or type your name. Signing records:

- the document version and SHA-256 hash,
- your consent,
- the authentication method used,
- time and basic request metadata.

A drawn/typed image alone is not a qualified digital signature. The record links the signature to the exact version hash.

## After signing

When every required party has signed the same version, the deal executes automatically:

- an executed copy is generated,
- a verification certificate and seal are issued,
- a public verification link/QR is created,
- notifications are sent.

Later changes require a new version and new signatures.

## Payments, obligations, and comments

- **Payments** record what was paid, when, by whom, and with what reference. A payment record is an entry by a party, not independent proof that money moved.
- **Obligations** track future actions and due dates; the reminder cron creates notifications.
- **Comments** keep negotiation history with optional attachments.

## Evidence pack

Download the ZIP from the deal workspace. It includes the agreement and versions, executed copy, certificate, signatures, payments, comments, event audit trail, and a hash-chain verification report.

Keep the ZIP and certificate with your own records. dealrec is not a substitute for legal advice or a court process.

## Verify a record

Anyone can use **Verify** with:

- a seal verification link or QR,
- a deal reference and matching invited email/phone (where required), or
- a file hash comparison.

Verification confirms what the platform recorded and whether the file matches the recorded hash. It does not prove identity, legal validity, or enforceability.

## Limitations

dealrec does not guarantee recovery of money, identity verification, notarisation, government recognition, admissibility, or enforceability. For high-value or complex matters, consult a qualified lawyer and use appropriate independent processes.
