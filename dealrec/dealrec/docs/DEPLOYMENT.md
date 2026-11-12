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
STORAGE_DIR=.storage
```

Also configure email/SMS and `CRON_SECRET`. Run the demo seed only in development.

## Important production settings

- Set `APP_URL` to the exact HTTPS origin. Invitation, verification and QR links depend on it.
- Use a long random `SESSION_SECRET`. Rotating it invalidates existing sessions.
- Keep `.storage` outside the build output and back it up with the database, or move storage to S3-compatible object storage.
- Use the pooled Neon URL at runtime. Reserve `DIRECT_URL` for migrations.
- Configure `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_API_KEY`, and `SMS_SENDER_ID` so OTPs are actually delivered.
- Set `CRON_SECRET` and call:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.example/api/cron/reminders
```

Schedule once per day. The endpoint avoids duplicate reminders within 24 hours.

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
