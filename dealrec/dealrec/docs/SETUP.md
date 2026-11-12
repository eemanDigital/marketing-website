# Local setup

## 1. Install

```bash
npm install
```

Use Node.js 20 or newer. The app uses the PostgreSQL driver adapter through `@prisma/adapter-pg`; no native SQLite build tools are needed.

## 2. Create the Neon development database

Create a Neon project, then create a development branch/database separate from production. Copy both connection strings:

- **Pooled** (`-pooler` in the host): used by the app for normal queries.
- **Direct/unpooled**: used by Prisma for migrations.

Use a database name such as `dealrec_dev`. Keep the production branch/database completely separate.

## 3. Configure

```bash
cp .env.example .env
cp .env.development.example .env.development
```

On Windows:

```powershell
Copy-Item .env.example .env
Copy-Item .env.development.example .env.development
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste it into `SESSION_SECRET` in `.env`. In `.env.development`, paste the Neon development branch URLs into `DATABASE_URL` and `DIRECT_URL`, and keep `APP_URL` as `http://localhost:3000` for local work.

Env loading priority, highest first:

1. Variables already set in the process environment
2. `.env.development.local`
3. `.env.local`
4. `.env.development`
5. `.env`

Production uses the same order with `.env.production`. For local production checks, copy `.env.production.example` to `.env.production`. On a hosting platform, set the variables directly in the platform instead of committing them.

Email and SMS are optional. Without provider credentials, development logs the messages and OTP codes are shown in the UI.

## 4. Database and seed

```bash
npm run db:migrate:dev
npm run db:seed
```

This applies the committed PostgreSQL migrations and creates the 10 templates, admin/demo users, two demo deals, demo witness records, and demo files under `.storage/`.

To reset only the development database:

```bash
npm run db:migrate:reset
```

This drops and recreates the development Neon database contents and reruns the seed. It is pinned to `APP_ENV=development`; never run it against production.

## 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Useful demo routes:

- `/sign-in`
- `/invite/demo-invite-2026`
- `/witness/demo-witness-2026`
- `/witness/demo-witness-attested-2026`
- `/verify/demo-verify-2026`

## 6. Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Common issues

- **`DATABASE_URL is not set`:** add it to `.env.development` or the process environment.
- **SSL errors:** keep `sslmode=require` in both Neon URLs.
- **Too many connections:** use the pooled `-pooler` URL for `DATABASE_URL`.
- **Migration cannot create a shadow database:** create another Neon database/branch and set `shadowDatabaseUrl` in `prisma.config.ts`.
- **Migration hits the wrong database:** `npm run db:migrate:dev` uses development; `npm run db:migrate:deploy` uses production.
- **Uploads disappear after redeploy:** `.storage/` is local and must be on persistent storage.
- **Invitation/verification links use the wrong host:** set `APP_URL` to the public origin.
- **OTP not delivered:** configure Resend/Termii, or use the development code shown in the UI.
- **Prisma client stale:** run `npx prisma generate`.
