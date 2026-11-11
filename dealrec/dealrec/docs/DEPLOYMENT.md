# Deployment

dealrec is a standard Next.js server app. It needs a long-running Node process, a writable persistent directory, and a database.

## Recommended baseline

- Node.js 20+ server or container
- HTTPS reverse proxy (Caddy, nginx, or a managed platform)
- Persistent volume mounted at the app directory for `prisma/dev.db` and `.storage/`
- Daily backups of the SQLite file **and** `.storage/`
- Scheduled cron request to `/api/cron/reminders`

## Build and start

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Set `NODE_ENV=production`, `APP_URL`, `SESSION_SECRET`, `DATABASE_URL`, `STORAGE_DIR`, and provider credentials in the host environment.

## Important production settings

- Set `APP_URL` to the exact HTTPS origin. Invitation, verification and QR links depend on it.
- Use a long random `SESSION_SECRET`. Rotating it invalidates existing sessions.
- Keep `.storage` outside the build output and back it up with the database.
- Configure `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_API_KEY`, and `SMS_SENDER_ID` so OTPs are actually delivered.
- Set `CRON_SECRET` and call:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.example/api/cron/reminders
```

Schedule once per day. The endpoint avoids duplicate reminders within 24 hours.

## Backups and restore

1. Stop writes or put the app in maintenance mode.
2. Copy `prisma/dev.db`.
3. Copy `.storage/`.
4. Restore both together; database document rows point at storage keys.

A standalone database backup is not enough because documents and signature assets live in `.storage/`.

## Scaling beyond one instance

SQLite plus local files works for a single instance. For multiple instances:

- Migrate Prisma to PostgreSQL.
- Replace the local storage functions with an S3-compatible implementation while keeping the same interface in `src/lib/storage.ts`.
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
