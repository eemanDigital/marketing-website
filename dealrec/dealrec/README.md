# dealrec

**Put the deal on record.** dealrec is a mobile-first record-keeping MVP for everyday agreements in Nigeria. It turns a structured deal into a versioned PDF, records who accepted and signed which version, locks an executed record, and gives each party an evidence pack and a public verification link.

> dealrec records platform events. It is **not** legal advice, a law firm, a notary, an NBA/Section 84 certificate, a government registry, or a guarantee that a record will be enforced or admitted in court.

## What works

- Email/password accounts with one-time-code email verification and password reset.
- Optional phone verification and password/session management.
- 10 guided agreement templates plus PDF upload.
- New versions with change summaries; signatures are tied to the exact document hash.
- Invitation links with OTP verification, accept / request changes / decline, and signing.
- Drawn or typed signatures with consent text, IP/user-agent metadata, and contact verification level.
- Immutable-style event timeline with a SHA-256 hash chain.
- Executed PDF, execution page, verification certificate with QR code, and a seal serial.
- Public verification by seal link or deal reference; optional file-hash comparison.
- Evidence ZIP (agreement, executed copy, certificate, signatures, payments, comments, audit trail, hash-chain verification report).
- Payment records, obligations, comments, notifications, and reminder cron endpoint.
- Admin area for users, deals, seal revocation, audit log, and invitation revocation.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4
- Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`)
- `pdf-lib` for PDFs, `qrcode` for verification QR codes, `signature_pad` for drawn signatures
- Local private file storage in `.storage/` (replaceable behind `src/lib/storage.ts`)

## Local setup

Requirements: Node.js 20+, npm.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edit .env and set SESSION_SECRET and APP_URL
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | SQLite URL, default `file:./prisma/dev.db` |
| `APP_URL` | yes in production | Public origin used in invite, verify, and QR links |
| `SESSION_SECRET` | yes | Signs session cookies; use a long random value |
| `STORAGE_DIR` | no | Private upload directory, default `.storage` |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Real email delivery; otherwise dev logs email |
| `SMS_API_KEY`, `SMS_SENDER_ID` | no | Real Termii SMS delivery; otherwise dev logs SMS |
| `CRON_SECRET` | no | Required to call the reminder cron endpoint |

When email/SMS is not configured, development mode logs the message and the UI displays OTP codes to make local testing possible. Do **not** expose OTP codes in production.

### Demo data

`npm run db:seed` creates:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dealrec.ng` | `DealrecAdmin123!` |
| Demo user | `ada@example.com` | `Dealrec123!` |
| Demo user | `tunde@example.com` | `Dealrec123!` |

Demo records:

- `DR-2026-DEMO01` — open personal loan awaiting the other party.
- `DR-2026-DEMO02` — fully signed service agreement with executed copy, certificate and seal.
- Invitation demo: <http://localhost:3000/invite/demo-invite-2026>
- Public verification demo: <http://localhost:3000/verify/demo-verify-2026>

The seed is idempotent for users, templates, and those two deals; demo files are written to `.storage/`.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run db:seed      # seed templates, users and demo records
```

## Main flows

1. **Create** a deal from a template or upload a PDF.
2. **Invite** the other party. The link can be shared over any channel you already use.
3. **Verify and accept** — the invited party confirms control of their email/phone with an OTP, reviews the agreement, and accepts or requests changes.
4. **Sign** — each required party draws or types a signature, confirms consent, and signs the current version hash.
5. **Execute** — when every required party has signed the same version, dealrec generates the executed copy, certificate, seal, and public verification token.
6. **Record** payments, obligations, and comments. Download the evidence ZIP at any time.
7. **Verify** later using the certificate link/QR, the deal reference, or file-hash comparison.

## Project layout

```text
src/app/                 App Router pages and route handlers
src/components/          UI, auth, deal, invite, profile and verify components
src/lib/                 db, auth, deals, agreement, PDF, evidence, storage, crypto
src/server/actions/      server actions (auth, deals, invite, sign, admin, verify)
prisma/schema.prisma     data model
prisma/seed.mjs          templates, demo users and demo deals
```

## Production notes

- Set a strong `SESSION_SECRET`, a real `APP_URL`, and configure email/SMS.
- Use a persistent volume for `.storage` and the SQLite file. Back up both together; database rows reference stored file keys.
- SQLite and local storage suit a single app instance. For horizontal scaling, move to PostgreSQL and object storage; keep the `src/lib/storage.ts` interface and the Prisma schema as the seam.
- Put the app behind HTTPS. Session cookies become `secure` automatically when `NODE_ENV=production`.
- Restrict admin access to trusted accounts; admin actions are audit-logged.
- Schedule `GET /api/cron/reminders` with `Authorization: Bearer $CRON_SECRET` (for example every day). It creates due-soon/overdue obligation notifications.
- Tune rate limits in `src/lib/rate-limit.ts` for your deployment; the current in-memory limiter is per-instance.
- Do not promise legal certainty. Keep the limitation language visible in the UI, PDFs, certificate, and verification page.

See [docs/SETUP.md](docs/SETUP.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/USER_GUIDE.md](docs/USER_GUIDE.md), and [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) for more detail.
