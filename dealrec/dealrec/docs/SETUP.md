# Local setup

## 1. Install

```bash
npm install
```

Use Node.js 20 or newer. The app uses a native SQLite driver (`better-sqlite3`); if installation fails, make sure build tools are available for your Node version, then reinstall.

## 2. Configure

```bash
cp .env.example .env
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste it into `SESSION_SECRET`. Keep `APP_URL` as `http://localhost:3000` for local work.

Email and SMS are optional. Without provider credentials, development logs the messages and OTP codes are shown in the UI.

## 3. Database and seed

```bash
npx prisma migrate dev
npm run db:seed
```

This creates `prisma/dev.db`, the 10 templates, admin/demo users, two demo deals, and demo files under `.storage/`.

To reset local data, stop the dev server, delete `prisma/dev.db` and `.storage/`, then rerun the two commands. The seed is idempotent, but a clean reset is useful when testing migrations.

## 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Useful demo routes:

- `/sign-in`
- `/invite/demo-invite-2026`
- `/verify/demo-verify-2026`

## 5. Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Common issues

- **`SESSION_SECRET` missing:** sessions cannot be signed reliably. Set the variable.
- **Uploads disappear after redeploy:** `.storage/` is local and must be on persistent storage.
- **Invitation/verification links use the wrong host:** set `APP_URL` to the public origin.
- **OTP not delivered:** configure Resend/Termii, or use the development code shown in the UI.
- **Database is locked:** stop extra dev servers; SQLite allows a single writer at a time.
- **Prisma client stale:** run `npx prisma generate`.
