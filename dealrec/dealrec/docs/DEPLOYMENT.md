# Deployment

dealrec is a standard Next.js server app. It needs a long-running Node process, object storage or a writable persistent directory, and a PostgreSQL database.

## Recommended baseline

- Node.js 20+ server or container
- HTTPS reverse proxy (Caddy, nginx, or a managed platform)
- Neon PostgreSQL production branch/database
- Persistent volume mounted at the app directory for `.storage/`, or S3-compatible object storage
- Neon backups/point-in-time restore **and** backups of `.storage/`
- Scheduled cron request to `/api/cron/reminders`

## Development and production separation

Use two Neon branches or projects:

| Environment | Env file | Database |
| --- | --- | --- |
| Development | `.env.development` | Neon development branch, e.g. `dealrec_dev` |
| Production | `.env.production` or host variables | Neon production branch, e.g. `dealrec` |

Both environments use the same Prisma schema and the same `prisma/migrations/` directory. Only the URLs differ.

For each environment:

- `DATABASE_URL` is the pooled `-pooler` URL used by the app.
- `DIRECT_URL` is the unpooled URL used by Prisma migration commands.
- Never point development commands at the production database.
- Do not commit real `.env.*` files. Only the `.example` files are tracked.

## Build and start

```bash
npm ci
npx prisma generate
npm run db:migrate:deploy
npm run build
npm run start
```

Set these in the host environment:

```env
NODE_ENV=production
APP_ENV=production
APP_URL=https://your-domain.example
SESSION_SECRET=...
DATABASE_URL=postgresql://...-pooler.../dealrec?sslmode=require
DIRECT_URL=postgresql://.../dealrec?sslmode=require
S3_BUCKET=dealrec-production
S3_REGION=auto
S3_ENDPOINT=https://your-s3-compatible-endpoint
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

For a server with a persistent disk, omit the `S3_*` variables and set `STORAGE_DIR` instead. Also configure email/SMS and `CRON_SECRET`. Run the demo seed only in development.

## Vercel setup

Vercel runs the app as serverless functions, so use S3-compatible object storage rather than the local filesystem.

1. Import the repository into Vercel and set **Root Directory** to `dealrec/dealrec`.
2. Keep the checked-in `vercel.json`; it sets `npm run vercel-build` and schedules the daily reminder cron.
3. Add the production environment variables in the Vercel dashboard. Do not set `STORAGE_DIR`.
4. Run `npm run db:migrate:deploy` with the production `DATABASE_URL`/`DIRECT_URL` before the first deploy and after new migrations.

Required storage variables:

| Variable | Purpose |
| --- | --- |
| `S3_BUCKET` | Private bucket name |
| `S3_REGION` | Provider region, or `auto` for Cloudflare R2 |
| `S3_ENDPOINT` | Provider S3 endpoint for R2, B2, MinIO, or another S3-compatible service |
| `S3_ACCESS_KEY_ID` | Storage access key |
| `S3_SECRET_ACCESS_KEY` | Storage secret key |
| `S3_FORCE_PATH_STYLE` | Set `true` only when the provider requires path-style requests |
| `S3_SESSION_TOKEN` | Optional temporary credential token |

`npm ci` runs `prisma generate`. The Vercel build command is `prisma generate && next build`; migrations are intentionally not part of the build so preview deployments cannot alter a production database.

Vercel Functions accept request bodies up to about 4.5MB. The app limits deal PDFs, receipts, and attachments to 4MB, and `next.config.ts` sets the server-action body limit to 4.5MB. Larger files need a direct-to-S3 upload flow.

`vercel.json` calls `GET /api/cron/reminders` once per day. Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is configured.

## Render setup

Create two Render Web Services from the same repository: one for development and one for production. Use separate Neon branches, domains, Resend API keys, and storage disks.

For both services:

- Runtime: Node 20+
- Build command: `npm ci && npx prisma generate && npm run db:migrate:deploy && npm run build`
- Start command: `npm run start`
- Health check path: `/`
- Persistent disk: mount at `/var/data` and set `STORAGE_DIR=/var/data/dealrec-storage`

Set these environment variables in the Render dashboard, not in `.env` files:

| Variable | Development service | Production service |
| --- | --- | --- |
| `NODE_ENV` | `production` | `production` |
| `APP_ENV` | `development` | `production` |
| `APP_URL` | `https://dealrec-dev.onrender.com` or custom dev domain | `https://your-production-domain` |
| `DATABASE_URL` | Neon development pooled URL | Neon production pooled URL |
| `DIRECT_URL` | Neon development direct URL | Neon production direct URL |
| `SESSION_SECRET` | long random dev secret | long random production secret |
| `STORAGE_DIR` | `/var/data/dealrec-storage` | `/var/data/dealrec-storage` |
| `RESEND_API_KEY` | dev Resend key | production Resend key |
| `EMAIL_FROM` | `dealrec <records@your-verified-domain>` | `dealrec <records@your-verified-domain>` |
| `CRON_SECRET` | optional | required |

`EMAIL_FROM` must use a domain verified in Resend. A placeholder domain such as `records@yourdomain.com` will make Resend reject every send.

For local development, put `RESEND_API_KEY` and `EMAIL_FROM` in `.env.development`, then restart `npm run dev`. Next.js loads `.env.development` before `.env`, so a value in `.env.development` overrides the shared `.env` file. Check the terminal for `[dealrec email] failed` logs when delivery fails.

If a user says no email arrived, check the Resend **Emails** log first. A `delivered` event means Resend handed the message to the recipient's mail provider; ask the user to check spam/junk and promotions. A `bounced` or `failed` event needs the address or domain issue fixed. Password reset deliberately sends nothing when the email has no account, so invitees who never signed up should create an account from their invitation instead.

Do not commit real Resend keys. Rotate any key that has been pasted into a tracked `.env.*.example` file.

## Important production settings

- Set `APP_URL` to the exact HTTPS origin. Invitation, verification and QR links depend on it.
- Use a long random `SESSION_SECRET`. Rotating it invalidates existing sessions.
- On Vercel, use S3-compatible object storage. On a server with a persistent disk, keep `.storage` outside the build output and back it up with the database.
- Use the pooled Neon URL at runtime. Reserve `DIRECT_URL` for migrations.
- Configure `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_API_KEY`, and `SMS_SENDER_ID` so OTPs are actually delivered.
- Set `CRON_SECRET` and call:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.example/api/cron/reminders
```

Schedule once per day. The endpoint avoids duplicate reminders within 24 hours.

Client IP headers are ignored by default. Set `TRUST_PROXY_HEADERS=true` only when the reverse proxy removes incoming `X-Forwarded-For` and `X-Real-IP` values and supplies its own trusted values. Never enable this setting when clients can reach the app directly or can choose those headers.

## Backups and restore

1. Enable Neon backups/point-in-time restore for the production branch.
2. Back up `.storage/` separately on the same schedule.
3. Restore the database and `.storage/` to points close together; document rows reference storage keys.

A database backup alone is not enough because documents and signature assets live outside PostgreSQL.

## Scaling

- Neon handles the hosted PostgreSQL layer; use its pooled connection string for multiple app instances.
- Replace local storage with an S3-compatible implementation while keeping the same interface in `src/lib/storage.ts`.
- Replace the in-memory rate limiter with Redis or a database-backed limiter.
- Ensure cron runs once per schedule, not once per instance.
- Keep file writes and database commits coordinated; on failure, clean up orphaned files.

## Security checklist

- HTTPS only; trusted proxy headers configured correctly.
- Strong admin passwords; admin accounts are few and monitored.
- Email/SMS providers restricted by API key scope and spending limits.
- Do not log OTPs or session cookies in production.
- Review `/admin` audit entries after sensitive actions.
- Keep dependencies patched and rerun lint, typecheck, and build before release.

## Legal/product positioning

Do not advertise dealrec as a law firm, notary, government registry, NBA/Section 84 certificate, or guarantee of enforceability/admissibility. The UI, PDFs, certificate, and verification page intentionally state the platform's limits. Keep those statements intact.
